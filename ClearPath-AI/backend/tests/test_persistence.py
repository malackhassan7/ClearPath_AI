"""Real migrations + API persistence across fresh Python processes.

Requires TEST_DATABASE_URL ending in _test and permission to create a disposable database.
Never migrates or resets the configured application database.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parents[1]
pytestmark = pytest.mark.real_postgres


def test_migrations_and_project_persistence_across_api_processes(real_pg_url):
    database_name = f"clearpath_{uuid.uuid4().hex}_test"
    admin = create_engine(real_pg_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{database_name}"'))
    db_url = make_url(real_pg_url).set(database=database_name)
    env = {**os.environ,
           "DATABASE_URL": db_url.set(drivername="postgresql+asyncpg").render_as_string(hide_password=False),
           "SYNC_DATABASE_URL": db_url.set(drivername="postgresql+psycopg2").render_as_string(hide_password=False),
           "APP_ENV": "test", "JWT_SECRET_KEY": "isolated-persistence-test-key-" + uuid.uuid4().hex}

    def run(*args):
        result = subprocess.run([sys.executable, *args], cwd=BACKEND, env=env,
                                capture_output=True, text=True, timeout=60)
        assert result.returncode == 0, result.stderr
        return result.stdout

    try:
        run("scripts/backend_setup.py", "--migrate")
        run("scripts/backend_setup.py", "--migrate")  # repeatable at head
        created = run("-c", '''
import json
from fastapi.testclient import TestClient
from app.main import app
with TestClient(app) as client:
    assert client.get('/health').status_code == 200
    registration = client.post('/api/v1/auth/register', json={
        'full_name':'Fictional Dairy Owner','email':'fictional-owner@example.com',
        'password':'FictionalTest123!', 'role':'entrepreneur'})
    assert registration.status_code == 201, registration.text
    headers={'Authorization':'Bearer '+registration.json()['access_token']}
    project=client.post('/api/v1/projects/', headers=headers, json={
        'project_name':'FICTIONAL — B2C Dairy Case', 'district':'Salem',
        'notes':'Fictional manufacturing, retail and distribution case; no official approval.'})
    assert project.status_code == 201, project.text
    print(json.dumps({'id': project.json()['project_id']}))
''')
        project_id = json.loads(created.strip().splitlines()[-1])["id"]
        # New interpreter, new FastAPI lifecycle, new SQLAlchemy connection pool.
        run("-c", f'''
from fastapi.testclient import TestClient
from app.main import app
with TestClient(app) as client:
    login=client.post('/api/v1/auth/login', json={{'email':'fictional-owner@example.com','password':'FictionalTest123!'}})
    assert login.status_code == 200, login.text
    response=client.get('/api/v1/projects/{project_id}', headers={{'Authorization':'Bearer '+login.json()['access_token']}})
    assert response.status_code == 200, response.text
    assert response.json()['project_name'].startswith('FICTIONAL')
''')
    finally:
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{database_name}" WITH (FORCE)'))
        admin.dispose()

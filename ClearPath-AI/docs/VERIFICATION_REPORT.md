# ClearPath-TN repair and verification report

## Included in this package
- Windows launcher `START_WINDOWS.bat`, which opens the project directory, checks Node/npm/Python availability, installs Node dependencies if Vite is missing, and starts the unified frontend/API command.
- `scripts/dev.mjs` uses `spawn(..., { shell: false })` so Windows paths containing spaces are not split by `cmd.exe`.
- The project keeps a single-folder workflow and uses the configured local API URL in `.env`.
- README and source-boundary notes explain that this is an academic prototype with simulated project/application data, not a government portal integration.

## Checks run during this repair
- `node --check scripts/dev.mjs`: passed.
- `python -m py_compile backend/app/main.py`: passed.
- `package.json` and `package-lock.json` parse as JSON: passed.
- A clean frontend production build could **not** be verified here. The dependency installation attempt timed out; the resulting partial `node_modules` directory caused TypeScript to report missing type-definition packages. Those errors are consistent with an incomplete install and do not establish that a complete install/build will pass.

## First-run instructions
1. Extract the ZIP.
2. Open the `clearpath-tn` folder.
3. Double-click `START_WINDOWS.bat`, or run `npm install` followed by `npm run dev` in PowerShell.
4. Open `http://localhost:3000`. API docs, when the backend starts successfully, are at `http://localhost:8000/docs`.

First run requires internet access to install dependencies. Keep the terminal open while using the app; press Ctrl+C to stop services.

## Important limitations
- Authentication and role switching are simulated in the frontend; they are not production authentication or server-enforced RBAC.
- Project and clearance records shown in the UI are demo data. Public-source snapshots do not establish live application status, legal applicability, or official approval.
- Do not upload real Aadhaar, PAN, bank statements, signatures, or other sensitive personal documents.

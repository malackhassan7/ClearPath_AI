# CSS fix and build verification

The stylesheet `src/styles.css` is kept as plain CSS. A malformed Markdown-formatted Google Fonts `@import` is removed if present; remote fonts are optional and are not required for the app to render.

## Run on Windows

Open PowerShell in the extracted `clearpath-tn` project folder and run:

```bat
npm install
npm run build
npm test
npm run dev
```

Open `http://localhost:3000`. The combined development script also starts the FastAPI backend and prints the API docs address.

The development launcher uses direct child-process spawning (`shell: false`) so Windows paths containing spaces such as `C:\Users\ATIF AHMED` are passed safely. If `npm run build` or `npm test` fails, copy the complete terminal output. A successful install is required before those checks can be trusted.

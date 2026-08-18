# Project Aura TypeScript Configuration

Aura has two TypeScript applications: the Next.js frontend at the repository root and the Express backend in `backend/`. Each application has its own `tsconfig.json` file and must be checked separately.

## Strict mode

Both configurations set `strict: true`. This enables TypeScript's strict safety family, including `noImplicitAny` and `strictNullChecks`.

| Check | Why it matters |
| --- | --- |
| `noImplicitAny` | Requires TypeScript to report values whose type would otherwise become accidental `any`. |
| `strictNullChecks` | Requires code to handle `null` and `undefined` rather than treating them as every other value. |
| `noImplicitReturns` | Requires functions to return a value on every reachable path when their return type requires one. |
| `noFallthroughCasesInSwitch` | Prevents accidental execution from one `switch` case into the next. |

## Explicitly relaxed options

| Option | Frontend | Backend | Current reason and trade-off |
| --- | --- | --- | --- |
| `noUnusedLocals` | `false` | `false` | Unused variables and imports are reported as ESLint warnings instead of TypeScript errors. This keeps existing warning cleanup separate from type correctness, but dead code can accumulate if warnings are ignored. |
| `noUnusedParameters` | `false` | `false` | Unused callback and middleware parameters do not fail TypeScript checks. ESLint still warns about many of them. |
| `skipLibCheck` | `true` | `true` | TypeScript does not check declaration files from installed packages. This speeds up checks and avoids third-party declaration noise, but can hide a library type-definition issue. |
| `allowJs` | `true` | not set | The frontend permits JavaScript files, but the current frontend source contains no `.js` or `.jsx` files. This has no current effect and should be reconsidered in a future configuration-tightening task. |

## Other configuration differences

The frontend uses `noEmit: true` because Next.js produces its build output. The backend emits compiled JavaScript into `backend/dist/` using its `outDir` setting.

The frontend uses `moduleResolution: "bundler"` for Next.js. The backend uses `moduleResolution: "node"` and CommonJS output because it runs directly in Node.js.

## Verification commands

Run these from the repository root:

```powershell
npx.cmd tsc --noEmit

cd backend
npx.cmd tsc --noEmit
```

Both commands must exit with code `0`. The resolved settings can be inspected without changing code:

```powershell
npx.cmd tsc --showConfig

cd backend
npx.cmd tsc --showConfig
```

## Beginner exercise

In a scratch TypeScript file, compare `string` with `string | null`. Then ask: what must a function do before calling a string method on the second type? The answer is the core idea behind `strictNullChecks`.

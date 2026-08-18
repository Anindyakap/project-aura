# Project Aura — Line-by-Line Learning Workflow

## Goal

The goal is not only to finish Aura. The goal is to become able to read, explain, modify, and eventually write TypeScript without copying blindly.

## Study one file at a time

Use this order because each group builds on the previous one:

1. Pure utility functions and types.
2. Simple presentational React components.
3. React state and event handlers.
4. API helper functions.
5. Express routes.
6. Middleware.
7. Controllers.
8. Database queries.
9. OAuth integration.
10. Cron jobs and insight rules.

## Required explanation format

Ask Codex to explain a real file using this table:

| Line or block | Exact code | Plain English | TypeScript syntax | Runtime effect | What could fail |
|---|---|---|---|---|---|

Do not let it skip imports, types, generics, callbacks, JSX expressions, or error handling.

## The six-pass method

### Pass 1 — File purpose

Explain the file in one sentence and identify whether it belongs to frontend, backend, database tooling, configuration, or tests.

### Pass 2 — Vocabulary

List every unfamiliar keyword and symbol, such as:

- `interface`
- `async`
- `await`
- `Promise`
- `useEffect`
- `Request`
- `Response`
- `as`
- `?`
- `??`
- `=>`

### Pass 3 — Data flow

Draw the values moving through the file.

```text
input → validation → transformation → output
```

For React:

```text
props/API data → state → JSX → user action → state update → re-render
```

For Express:

```text
HTTP request → middleware → controller → database/service → HTTP response
```

### Pass 4 — Line-by-line explanation

Explain logical blocks before individual punctuation. A five-line SQL call can be explained as one block, followed by syntax details for each line.

### Pass 5 — Predict before running

Before executing code, write what you expect to happen. Then run it and compare the result.

### Pass 6 — Rewrite from memory

Close the original file and recreate a smaller version. It does not need every production feature. The goal is to prove that the logic is understood.

## Beginner exercises for every file

Codex must provide three exercises:

1. **Observation:** Change text, a number, or a harmless style and predict the result.
2. **Guided modification:** Add a small field, validation rule, or UI state.
3. **Independent reconstruction:** Build a smaller equivalent function or component from scratch.

## Example lesson: AOV function

```ts
export function calculateAov(revenue: number, orders: number): number {
  if (orders === 0) {
    return 0;
  }

  return revenue / orders;
}
```

### Line-by-line

| Line | Explanation |
|---|---|
| `export function` | Create a named function that another file can import. |
| `calculateAov` | The function name describes its responsibility. |
| `revenue: number` | The first input must be a number. |
| `orders: number` | The second input must be a number. |
| `: number` | The function promises to return a number. |
| `if (orders === 0)` | Check the edge case that would otherwise divide by zero. |
| `return 0` | End the function and give the caller zero. |
| `return revenue / orders` | Divide revenue by order count and return the average. |

### Logic in normal language

```text
When there are no orders, AOV is zero.
Otherwise, AOV is total revenue divided by order count.
```

### Reconstruction exercise

Write a function called `calculateConversionRate` that accepts `conversions` and `visitors`. It must return zero when visitors are zero; otherwise return `(conversions / visitors) * 100`.

## Learning progress checklist

For each studied file:

- [ ] I can state its purpose without reading the documentation.
- [ ] I can explain every import.
- [ ] I can identify all inputs and outputs.
- [ ] I can trace one successful execution path.
- [ ] I can trace one failure path.
- [ ] I understand each TypeScript annotation.
- [ ] I can predict the result of a small modification.
- [ ] I completed the guided exercise.
- [ ] I recreated a smaller version from memory.
- [ ] I wrote one question that remains unclear.

## Codex prompt for a lesson

```text
Act as a patient TypeScript teacher. Read the real file at <PATH>. Do not modify it yet.

Teach it in this order:
1. Give a one-sentence purpose.
2. Explain where it sits in the Aura request flow.
3. List every import and why it exists.
4. List every type, interface, function, component, constant, and exported value.
5. Explain the code line by line in a table with columns: lines, exact code, plain English, syntax lesson, runtime effect, possible failure.
6. Draw the data flow in ASCII.
7. Explain one successful path and one failure path.
8. Give me three exercises: observation, guided modification, independent reconstruction.
9. Ask me five short questions to check my understanding.

Assume I understand page purposes but cannot yet read TypeScript. Define every technical term the first time you use it.
```

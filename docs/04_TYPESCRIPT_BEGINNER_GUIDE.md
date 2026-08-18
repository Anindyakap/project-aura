# TypeScript for Project Aura — Beginner Guide

## 1. JavaScript first, TypeScript second

TypeScript is JavaScript plus a system for describing what kind of values code expects. The browser does not execute TypeScript directly; the project toolchain converts it to JavaScript.

```ts
const storeName: string = "Aura Jewelry";
const orderCount: number = 42;
const isConnected: boolean = true;
```

Read the colon as **“has the type.”**

```text
storeName has the type string
orderCount has the type number
isConnected has the type boolean
```

## 2. Variables

```ts
const brandId = "abc-123";
let isLoading = false;
```

- `const` means the variable cannot be assigned a different value later.
- `let` means reassignment is allowed.
- Prefer `const` unless reassignment is genuinely needed.

## 3. Objects

```ts
const brand = {
  id: "abc-123",
  name: "Aura Jewelry",
};
```

An object groups named values. Access them with a dot:

```ts
brand.id;
brand.name;
```

## 4. Arrays

```ts
const brands = [
  { id: "1", name: "Aura Jewelry" },
  { id: "2", name: "Aura Clothing" },
];
```

Useful operations:

```ts
brands.map((brand) => brand.name);
brands.find((brand) => brand.id === "2");
brands.filter((brand) => brand.name.includes("Aura"));
```

## 5. Types and interfaces

```ts
interface Brand {
  id: string;
  name: string;
  domain?: string;
}
```

- `id: string` is required.
- `domain?: string` is optional because of `?`.

A variable can now be checked against that shape:

```ts
const brand: Brand = {
  id: "abc-123",
  name: "Aura Jewelry",
};
```

## 6. Functions

```ts
function calculateAov(revenue: number, orders: number): number {
  return orders === 0 ? 0 : revenue / orders;
}
```

Read it in sections:

- `function` declares a function.
- `calculateAov` is its name.
- `revenue: number` and `orders: number` are parameters.
- `: number` after the parentheses is the return type.
- `return` gives the result back to the caller.
- `condition ? valueA : valueB` is a ternary expression.

Equivalent long form:

```ts
function calculateAov(revenue: number, orders: number): number {
  if (orders === 0) {
    return 0;
  }

  return revenue / orders;
}
```

## 7. Arrow functions

```ts
const calculateAov = (revenue: number, orders: number): number => {
  return orders === 0 ? 0 : revenue / orders;
};
```

This is another syntax for creating a function. Arrow functions are common in React callbacks.

## 8. Import and export

```ts
import { getBrands } from "@/lib/api";
```

This says: load the exported `getBrands` value from another module.

```ts
export function getBrands() {
  // ...
}
```

`export` allows another file to import that value.

A default export has no braces when imported:

```ts
export default function DashboardPage() {}
```

```ts
import DashboardPage from "./page";
```

## 9. Async and await

API and database work takes time.

```ts
async function loadBrands() {
  const brands = await getBrands();
  return brands;
}
```

- `async` means the function returns a Promise.
- `await` pauses this function until the Promise settles.
- It does not freeze the whole website.

Error handling:

```ts
try {
  const brands = await getBrands();
  setBrands(brands);
} catch (error) {
  console.error(error);
  setError("Could not load brands");
} finally {
  setIsLoading(false);
}
```

## 10. Destructuring

```ts
const { user, token } = response;
```

This extracts `response.user` and `response.token` into variables.

For function parameters:

```ts
function KpiCard({ title, value }: KpiCardProps) {
  // ...
}
```

## 11. Optional chaining and nullish coalescing

```ts
const name = user?.name;
```

`?.` means: access `name` only if `user` is not null or undefined.

```ts
const displayName = user?.name ?? "Guest";
```

`??` uses the value on the right only when the left side is null or undefined.

## 12. Union types

```ts
type Theme = "light" | "dark";
```

The value must be exactly one of those choices.

```ts
type InsightPriority = "low" | "medium" | "high";
```

## 13. Generics

```ts
async function apiFetch<T>(endpoint: string): Promise<T> {
  // ...
}
```

`T` is a placeholder type. The caller chooses the expected response type:

```ts
const brands = await apiFetch<Brand[]>("/brands");
```

Now TypeScript understands that `brands` is an array of `Brand` objects.

## 14. React components and JSX

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}</p>;
}
```

- A React component is a function that returns JSX.
- JSX looks like HTML but is JavaScript syntax.
- `{name}` inserts a JavaScript expression into JSX.

## 15. State with `useState`

```tsx
const [isLoading, setIsLoading] = useState(false);
```

- `isLoading` is the current value.
- `setIsLoading` changes the value.
- `false` is the initial value.
- Changing state causes React to render the component again.

Typed state:

```tsx
const [brands, setBrands] = useState<Brand[]>([]);
```

## 16. Effects with `useEffect`

```tsx
useEffect(() => {
  loadBrands();
}, []);
```

The empty dependency array means the effect runs after the component first appears.

```tsx
useEffect(() => {
  if (selectedBrand) {
    loadMetrics(selectedBrand.id);
  }
}, [selectedBrand]);
```

This effect runs whenever `selectedBrand` changes.

## 17. Event handlers

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  // submit logic
}
```

`preventDefault()` stops the browser from performing its normal full-page form submission.

## 18. Express request handlers

```ts
export async function getBrands(req: Request, res: Response) {
  const userId = req.user.userId;
  const brands = await database.query(
    "SELECT * FROM brands WHERE user_id = $1",
    [userId],
  );

  res.json({ brands: brands.rows });
}
```

- `req` represents the incoming HTTP request.
- `res` is used to create the HTTP response.
- `$1` is a SQL parameter placeholder.
- `[userId]` provides the safe value for `$1`.
- `res.json(...)` sends JSON to the frontend.

## 19. Middleware

```ts
router.get("/brands", protect, getBrands);
```

Execution order:

1. The request matches `GET /brands`.
2. `protect` checks authentication.
3. If authentication succeeds, `getBrands` runs.
4. If it fails, `getBrands` never runs.

## 20. Reading symbols aloud

| Symbol | How to read it | Typical meaning |
|---|---|---|
| `:` | “has type” | Type annotation |
| `=>` | “goes to” | Arrow function |
| `===` | “strictly equals” | Compare value and type |
| `!==` | “strictly does not equal” | Negative comparison |
| `&&` | “and” | Both conditions must be true |
| `||` | “or” | At least one condition is true |
| `!value` | “not value” | Boolean negation |
| `?.` | “if it exists, access” | Optional chaining |
| `??` | “otherwise, when missing” | Nullish fallback |
| `...` | “spread” or “rest” | Copy or gather values |
| `<T>` | “generic type T” | Reusable type placeholder |
| `[]` | “array of” | Collection |
| `{}` | object or code block | Depends on context |

## 21. A practical reading method

For every unfamiliar code block, answer these questions in order:

1. What values enter this block?
2. What types do those values have?
3. What condition is being tested?
4. What changes in memory, state, database, browser storage, or UI?
5. What value leaves the block?
6. What can fail?
7. Who calls this code?
8. What code runs next?

Do not try to memorize the entire file. Trace one path at a time.

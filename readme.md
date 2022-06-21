# @kaffee/latte

> A based web component & svgo library, tree shaking support
> Only TypeScript

## Installation

Install with npm

```bash
  npm install --dev @kaffee/latte
```

Install with yarn

```bash
  yarn add --dev @kaffee/latte
```

Install with pnpm

```bash
  pnpm add -D @kaffee/latte
```

## Usage

### Configuration file

```json
{
    "svg":"./src/icons/svg",
    "dist":"./src/icons/latte",
    "eslint":"quotes,unicorn/no-abusive-eslint-disable,prettier/prettier",
    "namespace":true
}
```

### Convert SVG to TypeScript

```bash
    pnpm latte
```

### Define Component

```typescript
import { registerSvgIcon } from "@kaffee/latte";
import { bank_card, member, wallet } from "./icons/latte";

registerSvgIcon([bank_card, member, wallet]);
```

### User SVG

```html
    <latte-svg
      style="fill:red"
      width="30px"
      height="30px"
      namespace="latte"
      name="member"
    />
```

## License

[GPL](https://choosealicense.com/licenses/gpl-3.0/)

## Contributors

<a href="https://github.com/Muromi-Rikka" >
  <img style="border-radius:200px;" src="https://github.com/Muromi-Rikka.png?size=50">
</a>

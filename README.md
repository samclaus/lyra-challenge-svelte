This repository is my Svelte-based solution to [a job candidate challenge from Lyra Solar](https://docs.google.com/document/d/e/2PACX-1vQu8Vf3kWChnXuKylxWAQuFOzlaFr4SFyAkj-X5UvjjkhC_J5p1YOaZH1bisgtSKrFy6MUXNO9mdWh4/pub).

The project uses Svelte as the UI framework/library, and Vite for bundling. For an alternative solution in React, see https://github.com/samclaus/lyra-challenge-react.

I use [PNPM](https://pnpm.io/) instead of NPM as my package manager, but NPM should still work just fine. To run in development mode:

```Bash
npm install
npm run dev
```

## High-level Design

I used Svelte and did not use any state management libraries. I am not very familiar with the popular state management libraries, but I have written a great deal of custom abstractions that fit my needs very well for a large project (tiCrypt) before. More importantly, I feel like a big state management setup would be pretty overkill for this small of a project.

This project only uses a single Svelte component (`Editor`). I originally made an `IconButton` component to be consumed within the `Editor` component, but I ended up declaring component props for every attribute I needed on the buttons and componentizing did not save me any hassle in the end. I prefer to keep things simple to start with, and only abstract as necessary.

The Svelte compiler adds code to invalidate bindings wherever it sees an assignment (using `=`) to a local variable that is referenced in the markup **or** in a reactive declaration (prefixed with `$:`). I did not use any callback-based stores or the like in the application because there was no need to.

## Things I don't like about my solution

Consider this an exhaustive list (I like everything else about my solution).

- I ended up trying to work around Svelte's reactivity a little bit, and I'm not sure I would consider my code as idiomatic as it should be
- I didn't end up adding tooltips like I originally intended (got a life to live!)
- I also didn't end up adding a help modal like I originally intended (same reason as the tooltips)
- I probably could have written the code in a more performant way--I was trying to mutate and avoid allocating new arrays as much as possible but there are still a few spots that put some stress on the garbage collector

## Technical considerations

The following were present in the original README generated by the `pnpm create vite --template svelte-ts` command. I left them here because they are useful but semi-esoteric things to remember.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

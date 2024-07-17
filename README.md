# html-imports

I started this project because I wanted a simple, dependency-free, client-side solution for creating modular, reusable HTML elements that didn't require any transpiler/preprocessing metaframeworks. **This library is experimental, so use it at your own discretion!** That being said, if you end up playing around with this thing, I hope you end up liking it! :D

## Table of contents

1. [How does it work?](#how-does-it-work)
2. [Goals](#goals)
    1. [Design goals](#design-goals)
    2. [Design principles](#design-principles)
    3. [Challenges](#challenges)
3. [Feature roadmap](#feature-roadmap)

## How does it work?

By loading `html-imports.js` in the `<head>` of the document, the body of the document is observed by a `MutationObserver` until a `<html-imports>` element is added to the DOM. Immediately, it is hidden to prevent it from being rendered in the browser, its contents are parsed, files fetched (in the case of `src` being present) and elements are dynamically defined using the browser's `customElement` registry. HTML Elements with an unknown tag name automatically become defined as `HTMLUnknownElement`, which is used to determine if an element should be hidden until a definition is imported matching its tag.

## Goals

#### Design goals

1. Intuitive, easy to use, easy to share component libraries
2. Minimal impact on performance

#### Design principles

1. Components have the final say over their style.
2. Components may define behavior, methods etc. through inline JavaScript directly in their HTML file. End result is a single class-definition-like HTML file. These methods are parsed a single time when imported.

#### Challenges

1. Optimize render speed.
2. Prevent security vulnerabilities in the case of

## [Feature roadmap](feature-roadmap)

- [x] `<html-imports></html-imports>`

  The `<html-imports>` element allows you to define a list of custom HTML elements to import from a remote or local source through the attribute `src`. You can also override the imported component's name through the `name` attribute.
  
  Example:
  
  ```html
  <html-imports cors="false" base="./">
      <!-- imports go here -->
  </html-imports>
  ```

- [x] `<component></component>`

  The `<component>` element defines one element to be registered as a reusable web component.

  Example:

  ```html
  <html-imports base="./">
    <component src="card.html" name="my-card"></component>
    <component src="list.html" name="my-list"></component>
    
    <!-- assuming the outer element inside this imported file ... -->
    <!-- ... uses the tag <cool-button></cool-button>, the    ... -->
    <!-- ... this element becomes available under will not change -->
    <component src="button.html"></component>
  </html-imports>

  ```


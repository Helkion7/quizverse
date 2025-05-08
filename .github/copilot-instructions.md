# Minimalistic Matte Black quiz Styling Guidelines

## Core Theme Philosophy

- Pure, minimalist aesthetic
- Absolute black background
- Extremely low contrast elements
- Focus on functionality over decoration

## Color Palette

```css
:root {
  --color-background: oklch(0.05 0.01 250);
  --color-text-primary: oklch(0.9 0.02 250);
  --color-text-secondary: oklch(0.6 0.01 250);
  --color-accent: oklch(0.7 0.05 280);
  --color-border: oklch(0.2 0.01 250);
  --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
}
```

## Layout Principles

- Embrace negative space
- Extremely tight, compact layouts
- Minimal padding and margins
- Linear, vertical-first design

### Todo Item Layout

```css
.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  padding: 0 8px;
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-fast);
}

.todo-item:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
```

```html
<div class="todo-item">
  <!-- Minimal todo item structure -->
</div>
```

## Typography

```css
h1 {
  font-size: 1.25rem;
  font-weight: 200;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
  margin: 0;
}

p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}
```

```html
<h1>Todo List</h1>
<p>Minimalism in motion</p>
```

## Interactive Elements

```css
input {
  width: 100%;
  background-color: transparent;
  color: var(--color-text-primary);
  border: none;
  border-bottom: 1px solid var(--color-border);
  padding: 8px 0;
  transition: border-color var(--transition-fast);
}

input:focus {
  outline: none;
  border-bottom-color: var(--color-accent);
}

button {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 8px;
  transition: color var(--transition-fast);
}

button:hover {
  color: var(--color-accent);
}

/* For accessibility */
button:focus,
input:focus {
  outline: none;
}
```

```html
<input type="text" placeholder="Add a new task..." /> <button>Add Task</button>
```

## Icon Styling

```css
.icon {
  color: var(--color-accent);
  width: 16px;
  height: 16px;
  stroke-width: 1;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.icon:hover {
  opacity: 1;
}
```

```html
<svg class="icon" viewBox="0 0 24 24">
  <!-- SVG path here -->
</svg>
```

## Animations and Transitions

```css
.fade-in {
  animation: fadeIn var(--transition-fast);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.slide-in {
  animation: slideIn var(--transition-fast);
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## Responsive Considerations

```css
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

/* No media queries needed as the design is inherently responsive */
```

## Accessibility

```css
:focus {
  outline: none;
}

.focus-container:focus-within {
  box-shadow: 0 0 0 1px var(--color-accent);
  transition: box-shadow var(--transition-fast);
}

/* Ensure minimum tap target size for mobile */
.interactive-element {
  min-height: 44px;
  min-width: 44px;
}

/* High contrast mode support */
@media (forced-colors: active) {
  .todo-item {
    border-color: CanvasText;
  }

  .icon {
    forced-color-adjust: auto;
  }
}
```

```html
<div class="focus-container">
  <!-- Focusable container -->
</div>
```

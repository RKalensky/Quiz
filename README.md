# Interactive Quiz Game

An interactive quiz game for two teams. The game consists of several rounds where participants can earn points.

## Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

## How to Run

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Game Rounds

- **Stump** — round with categories featuring an easy and a hard question
- **Five-Ten** — round with word lists
- **Four for Forty** — round with categories for quick answers

## Configuration File `game.json`

The file `src/config/game.json` contains all the quiz data:

### Structure

```json
{
  "stump": [
    ...
  ],
  "fiveTen": [
    ...
  ],
  "FourForForty": [
    ...
  ]
}
```

### `stump` — array of objects for the "Stump" round

Each object has the following fields:

- `category` — category name
- `agenda` — hint/description of the category
- `easyQuestion` — easy question
- `hardQuestion` — hard question

### `fiveTen` — array of strings for the "Five-Ten" round

List of categories (e.g., "pronouns", "Hollywood actors", "bird species")

### `FourForForty` — array of strings for the "Four for Forty" round

List of categories for quick answers (e.g., "Name", "Animal", "City", "Character")


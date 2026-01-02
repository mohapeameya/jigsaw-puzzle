import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [gridSize, setGridSize] = useState(4);
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  // const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState({});

  /* ---------- LOCAL STORAGE ---------- */

  // Load best scores
  useEffect(() => {
    const saved = localStorage.getItem("sliding-best");
    if (saved) setBest(JSON.parse(saved));
  }, []);

  // Save best scores
  useEffect(() => {
    if (Object.keys(best).length > 0) {
      localStorage.setItem("sliding-best", JSON.stringify(best));
    }
  }, [best]);

  /* ---------- GAME LOGIC ---------- */

  function createNumbers(size) {
    return [...Array(size * size - 1).keys()].map((n) => n + 1);
  }

  function countInversions(arr) {
    let inv = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inv++;
      }
    }
    return inv;
  }

  function shuffle(size) {
    let nums;
    do {
      nums = [...createNumbers(size)].sort(() => Math.random() - 0.5);
    } while (
      countInversions(nums) % 2 !== 0 || // unsolvable if inversions odd
      nums.every((n, i) => n === i + 1) // avoid already solved
    );

    return nums.concat(0); // empty tile always bottom-right
  }

  function shuffleTiles() {
    setTiles(shuffle(gridSize));
    setMoves(0);
    // setSeconds(0);
    setWon(false);
  }

  function indexToRowCol(index) {
    return {
      row: Math.floor(index / gridSize),
      col: index % gridSize,
    };
  }

  function isAdjacent(i1, i2) {
    const a = indexToRowCol(i1);
    const b = indexToRowCol(i2);
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  function isSolved(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return arr[arr.length - 1] === 0;
  }

  // function handleClick(index) {
  //   if (won) return;

  //   const emptyIndex = tiles.indexOf(0);
  //   if (!isAdjacent(index, emptyIndex)) return;

  //   const newTiles = [...tiles];
  //   [newTiles[index], newTiles[emptyIndex]] = [
  //     newTiles[emptyIndex],
  //     newTiles[index],
  //   ];

  //   setTiles(newTiles);
  //   setMoves(m => m + 1);

  //   if (isSolved(newTiles)) {
  //     setWon(true);
  //     setBest(b => ({
  //       ...b,
  //       [gridSize]:
  //         b[gridSize] === undefined || moves + 1 < b[gridSize]
  //           ? moves + 1
  //           : b[gridSize],
  //     }));
  //   }
  // }
  function handleClick(index) {
    if (won) return;

    const emptyIndex = tiles.indexOf(0);
    const a = indexToRowCol(index);
    const e = indexToRowCol(emptyIndex);

    const newTiles = [...tiles];

    // Adjacent → simple swap
    if (isAdjacent(index, emptyIndex)) {
      [newTiles[index], newTiles[emptyIndex]] = [
        newTiles[emptyIndex],
        newTiles[index],
      ];
      setTiles(newTiles);
      setMoves((m) => m + 1);
    }

    // Same row → slide row
    else if (a.row === e.row) {
      if (index < emptyIndex) {
        // slide right
        for (let i = emptyIndex; i > index; i--) {
          newTiles[i] = newTiles[i - 1];
        }
      } else {
        // slide left
        for (let i = emptyIndex; i < index; i++) {
          newTiles[i] = newTiles[i + 1];
        }
      }

      newTiles[index] = 0;
      setTiles(newTiles);
      setMoves((m) => m + 1);
    }

    // Same column → slide column
    else if (a.col === e.col) {
      if (index < emptyIndex) {
        // slide down
        for (let i = emptyIndex; i > index; i -= gridSize) {
          newTiles[i] = newTiles[i - gridSize];
        }
      } else {
        // slide up
        for (let i = emptyIndex; i < index; i += gridSize) {
          newTiles[i] = newTiles[i + gridSize];
        }
      }

      newTiles[index] = 0;
      setTiles(newTiles);
      setMoves((m) => m + 1);
    }

    if (isSolved(newTiles)) {
      setWon(true);
      setBest((b) => ({
        ...b,
        [gridSize]:
          b[gridSize] === undefined || moves + 1 < b[gridSize]
            ? moves + 1
            : b[gridSize],
      }));
    }
  }

  /* 🔑 START SHUFFLED + RESHUFFLE ON GRID CHANGE */
  useEffect(() => {
    setTiles(shuffle(gridSize));
    setMoves(0);
    // setSeconds(0);
    setWon(false);
  }, [gridSize]);

  // /* TIMER */
  // useEffect(() => {
  //   if (won) return;
  //   const timer = setInterval(() => setSeconds(s => s + 1), 1000);
  //   return () => clearInterval(timer);
  // }, [won]);

  return (
    <div className="app">
      <div className="app-header">Jigsaw Puzzle</div>
      <div className="grid-selector">
        {[3, 4, 5].map((size) => (
          <button
            key={size}
            onClick={() => setGridSize(size)}
            className={gridSize === size ? "active" : ""}
          >
            {size}×{size}
          </button>
        ))}
      </div>

      <div className="stats">
        <div>Moves: {moves}</div>
        {/* <div>Time: {seconds}s</div> */}
        <div>Best: {best[gridSize] ?? "-"}</div>
      </div>

      <button className="shuffle-btn" onClick={shuffleTiles}>
        Shuffle
      </button>

      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {tiles.map((value, index) =>
          value === 0 ? (
            <div key={index} />
          ) : (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className="tile"
            >
              {value}
            </button>
          )
        )}
      </div>

      {won && <div className="win">🎉 Puzzle Solved!</div>}
    </div>
  );
}

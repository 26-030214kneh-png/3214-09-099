// ========================================
// 🐾 동물팡 게임
// ========================================

// 게임 설정
const ROWS = 8;
const COLS = 8;
const MAX_MOVES = 30;

// 사용할 동물
const ANIMALS = [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼"
];

// 게임 상태
let board = [];

let score = 0;
let combo = 0;
let moves = MAX_MOVES;

let selectedCell = null;
let isProcessing = false;


// HTML 요소
const gameBoard = document.getElementById("gameBoard");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const movesElement = document.getElementById("moves");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restartButton");


// ========================================
// 게임 시작
// ========================================

function startGame() {

    score = 0;
    combo = 0;
    moves = MAX_MOVES;

    selectedCell = null;
    isProcessing = false;

    createBoard();

    updateInfo();

    messageElement.textContent =
        "동물을 클릭해서 서로 위치를 바꿔보세요!";
}


// ========================================
// 게임판 생성
// ========================================

function createBoard() {

    board = [];

    for (let row = 0; row < ROWS; row++) {

        board[row] = [];

        for (let col = 0; col < COLS; col++) {

            let animal;

            // 처음부터 3개가 맞지 않도록 생성
            do {

                animal =
                    ANIMALS[
                        Math.floor(
                            Math.random() * ANIMALS.length
                        )
                    ];

            } while (
                createsMatch(row, col, animal)
            );

            board[row][col] = animal;
        }
    }

    renderBoard();
}


// ========================================
// 생성할 때 매치가 생기는지 확인
// ========================================

function createsMatch(row, col, animal) {

    // 가로 3개 확인
    if (
        col >= 2 &&
        board[row][col - 1] === animal &&
        board[row][col - 2] === animal
    ) {
        return true;
    }

    // 세로 3개 확인
    if (
        row >= 2 &&
        board[row - 1][col] === animal &&
        board[row - 2][col] === animal
    ) {
        return true;
    }

    return false;
}


// ========================================
// 게임판 화면 출력
// ========================================

function renderBoard() {

    gameBoard.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            const cell = document.createElement("div");

            cell.classList.add("cell");

            cell.textContent =
                board[row][col];

            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.addEventListener(
                "click",
                () => handleCellClick(row, col)
            );

            gameBoard.appendChild(cell);
        }
    }
}


// ========================================
// 동물 클릭
// ========================================

function handleCellClick(row, col) {

    if (isProcessing) {
        return;
    }

    if (moves <= 0) {
        return;
    }

    const clickedCell =
        getCellElement(row, col);


    // 첫 번째 선택
    if (selectedCell === null) {

        selectedCell = {
            row,
            col
        };

        clickedCell.classList.add("selected");

        messageElement.textContent =
            "이동할 동물을 선택하세요!";

        return;
    }


    // 같은 칸 클릭
    if (
        selectedCell.row === row &&
        selectedCell.col === col
    ) {

        clickedCell.classList.remove("selected");

        selectedCell = null;

        messageElement.textContent =
            "동물을 선택하세요.";

        return;
    }


    // 인접한 칸인지 확인
    if (
        isAdjacent(
            selectedCell.row,
            selectedCell.col,
            row,
            col
        )
    ) {

        swapAnimals(
            selectedCell.row,
            selectedCell.col,
            row,
            col
        );

    } else {

        // 인접하지 않은 경우
        const oldCell =
            getCellElement(
                selectedCell.row,
                selectedCell.col
            );

        oldCell.classList.remove("selected");

        selectedCell = {
            row,
            col
        };

        clickedCell.classList.add("selected");
    }
}


// ========================================
// 인접한 칸인지 확인
// ========================================

function isAdjacent(
    row1,
    col1,
    row2,
    col2
) {

    const rowDistance =
        Math.abs(row1 - row2);

    const colDistance =
        Math.abs(col1 - col2);

    return (
        rowDistance + colDistance === 1
    );
}


// ========================================
// 동물 위치 교환
// ========================================

async function swapAnimals(
    row1,
    col1,
    row2,
    col2
) {

    isProcessing = true;

    clearSelection();


    // 교환
    const temp =
        board[row1][col1];

    board[row1][col1] =
        board[row2][col2];

    board[row2][col2] =
        temp;


    renderBoard();


    // 매치 확인
    let matches =
        findAllMatches();


    // 매치가 없다면 원상복구
    if (matches.length === 0) {

        const temp2 =
            board[row1][col1];

        board[row1][col1] =
            board[row2][col2];

        board[row2][col2] =
            temp2;

        renderBoard();

        messageElement.textContent =
            "❌ 매칭되지 않았어요!";

        isProcessing = false;

        return;
    }


    // 이동 횟수 차감
    moves--;

    combo = 0;


    // 연쇄 매칭 처리
    while (matches.length > 0) {

        combo++;

        const gainedScore =
            matches.length * 10 * combo;

        score += gainedScore;


        messageElement.textContent =
            `✨ ${matches.length}개 제거! +${gainedScore}점`;


        markMatchedCells(matches);

        await sleep(250);

        removeMatches(matches);

        await sleep(150);

        dropAnimals();

        await sleep(250);

        fillEmptyCells();

        renderBoard();

        await sleep(200);

        matches =
            findAllMatches();
    }


    updateInfo();


    // 게임 종료 확인
    if (moves <= 0) {

        gameOver();

    } else {

        messageElement.textContent =
            combo > 1
                ? `🔥 ${combo} 콤보!`
                : "좋아요! 계속 도전하세요!";
    }


    isProcessing = false;
}


// ========================================
// 모든 매치 찾기
// ========================================

function findAllMatches() {

    const matches = new Set();


    // 가로 검사
    for (let row = 0; row < ROWS; row++) {

        let count = 1;

        for (let col = 1; col <= COLS; col++) {

            if (
                col < COLS &&
                board[row][col] !== null &&
                board[row][col] ===
                board[row][col - 1]
            ) {

                count++;

            } else {

                if (count >= 3) {

                    for (
                        let k = col - count;
                        k < col;
                        k++
                    ) {

                        matches.add(
                            `${row},${k}`
                        );
                    }
                }

                count = 1;
            }
        }
    }


    // 세로 검사
    for (let col = 0; col < COLS; col++) {

        let count = 1;

        for (let row = 1; row <= ROWS; row++) {

            if (
                row < ROWS &&
                board[row][col] !== null &&
                board[row][col] ===
                board[row - 1][col]
            ) {

                count++;

            } else {

                if (count >= 3) {

                    for (
                        let k = row - count;
                        k < row;
                        k++
                    ) {

                        matches.add(
                            `${k},${col}`
                        );
                    }
                }

                count = 1;
            }
        }
    }


    return [...matches].map(key => {

        const [row, col] =
            key.split(",").map(Number);

        return {
            row,
            col
        };
    });
}


// ========================================
// 매치된 칸 표시
// ========================================

function markMatchedCells(matches) {

    matches.forEach(({ row, col }) => {

        const cell =
            getCellElement(row, col);

        if (cell) {
            cell.classList.add("matched");
        }
    });
}


// ========================================
// 매치 제거
// ========================================

function removeMatches(matches) {

    matches.forEach(({ row, col }) => {

        board[row][col] = null;
    });
}


// ========================================
// 동물 떨어뜨리기
// ========================================

function dropAnimals() {

    for (let col = 0; col < COLS; col++) {

        let emptyRow = ROWS - 1;

        for (
            let row = ROWS - 1;
            row >= 0;
            row--
        ) {

            if (board[row][col] !== null) {

                board[emptyRow][col] =
                    board[row][col];

                emptyRow--;
            }
        }


        // 위쪽 빈칸
        while (emptyRow >= 0) {

            board[emptyRow][col] = null;

            emptyRow--;
        }
    }
}


// ========================================
// 빈칸을 새로운 동물로 채우기
// ========================================

function fillEmptyCells() {

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            if (board[row][col] === null) {

                board[row][col] =
                    randomAnimal();
            }
        }
    }
}


// ========================================
// 랜덤 동물
// ========================================

function randomAnimal() {

    return ANIMALS[
        Math.floor(
            Math.random() * ANIMALS.length
        )
    ];
}


// ========================================
// 선택 표시 제거
// ========================================

function clearSelection() {

    document
        .querySelectorAll(".selected")
        .forEach(cell => {

            cell.classList.remove("selected");
        });

    selectedCell = null;
}


// ========================================
// 화면 정보 업데이트
// ========================================

function updateInfo() {

    scoreElement.textContent =
        score.toLocaleString();

    comboElement.textContent =
        combo;

    movesElement.textContent =
        moves;
}


// ========================================
// 게임 종료
// ========================================

function gameOver() {

    messageElement.textContent =
        `🎉 게임 종료! 최종 점수: ${score.toLocaleString()}점`;

    alert(
        `🎉 게임 종료!\n\n최종 점수: ${score.toLocaleString()}점`
    );
}


// ========================================
// HTML 칸 가져오기
// ========================================

function getCellElement(row, col) {

    return document.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`
    );
}


// ========================================
// 잠시 기다리기
// ========================================

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}


// ========================================
// 다시 시작 버튼
// ========================================

restartButton.addEventListener(
    "click",
    startGame
);


// ========================================
// 게임 실행
// ========================================

startGame();

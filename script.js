// script.js
// ゲームの状態と設定
let currentLevel = 1;
let score = 0;
let levelScore = 0; // 各レベルのスコア
let totalScore = 0; // 全レベル合計スコア
let timeLeft = 60;
let gameInterval;
let itemDropInterval;
let levelTimerInterval;
let levelTransitionTimer = 3; // レベル切り替え時の待機時間
let isGameActive = false;
let isGamePaused = false;
let hasPlayerMoved = false; // プレイヤーが動いたかどうかのフラグ

// DOM要素の取得
const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');
const timeDisplay = document.getElementById('time-display');
const levelDisplay = document.getElementById('level-display');
const timeGauge = document.getElementById('time-gauge');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const levelEndScreen = document.getElementById('level-end-screen');
const levelScoreDisplay = document.getElementById('level-score');
const nextLevelButton = document.getElementById('next-level-button');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// 各レベルのスコア表示用
const level1ScoreDisplay = document.getElementById('level1-score-display');
const level2ScoreDisplay = document.getElementById('level2-score-display');
const level3ScoreDisplay = document.getElementById('level3-score-display');
const totalScoreDisplay = document.getElementById('total-score-display');


// 効果音とBGM
const bgm = document.getElementById('bgm');
const sfxCatch = document.getElementById('sfx-catch');
const sfxBomb = document.getElementById('sfx-bomb');
const sfxPowerup = document.getElementById('sfx-powerup');
const sfxClock = document.getElementById('sfx-clock');
const sfxGoldenIce = document.getElementById('sfx-golden-ice');
const sfxLevelEnd = document.getElementById('sfx-level-end');
const sfxBonus = document.getElementById('sfx-bonus');
const sfxMst = document.getElementById('sfx-mst');

// アイテムの種類と画像パス
const itemTypes = {
    iceCream: { score: 10, src: 'ice cream.png', width: 40, height: 40, type: 'iceCream' },
    iceCream2: { score: 15, src: 'ice 2.png', width: 40, height: 40, type: 'iceCream2' },
    goldenIce: { score: 50, src: 'soft cream.png', width: 40, height: 40, type: 'goldenIce' },
    bomb: { score: -20, src: 'bomb.png', width: 50, height: 50, type: 'bomb' },
    clock: { score: 0, timeBonus: 10, src: 'clock.png', width: 40, height: 40, type: 'clock' },
    powerUp: { score: 0, powerUp: true, src: 'powerup.png', width: 40, height: 40, type: 'powerUp' }
};

// レベルごとの設定
const levels = {
    1: {
        time: 60,
        requiredScore: 300,
        dropInterval: 1000,
        itemProbabilities: {
            iceCream: 0.6,
            iceCream2: 0.2,
            goldenIce: 0.05,
            bomb: 0.1,
            clock: 0.03,
            powerUp: 0.02
        },
        bg: 'bg-level-1.jpg'
    },
    2: {
        time: 60,
        requiredScore: 500,
        dropInterval: 800,
        itemProbabilities: {
            iceCream: 0.5,
            iceCream2: 0.25,
            goldenIce: 0.07,
            bomb: 0.12,
            clock: 0.03,
            powerUp: 0.03
        },
        bg: 'bg-level-2.jpg'
    },
    3: {
        time: 60,
        requiredScore: 800,
        dropInterval: 600,
        itemProbabilities: {
            iceCream: 0.4,
            iceCream2: 0.3,
            goldenIce: 0.1,
            bomb: 0.15,
            clock: 0.03,
            powerUp: 0.02
        },
        bg: 'bg-level-3.jpg'
    }
};

// ゲーム初期化
function initializeGame() {
    currentLevel = 1;
    score = 0;
    levelScore = 0;
    totalScore = 0;
    level1ScoreDisplay.textContent = 0;
    level2ScoreDisplay.textContent = 0;
    level3ScoreDisplay.textContent = 0;
    totalScoreDisplay.textContent = 0;
    levelEndScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex'; // スタート画面を表示
    // gameContainer.style.display = 'none'; // ゲーム画面を非表示
    player.style.width = '60px'; // プレイヤーの幅を初期値に戻す
    player.style.height = '60px'; // プレイヤーの高さを初期値に戻す
    player.style.backgroundImage = 'url(\'player.png\')'; // プレイヤー画像を初期値に戻す
    updateDisplay();
    // 音楽を停止し、初期化
    bgm.pause();
    bgm.currentTime = 0;
    isGameActive = false;
    isGamePaused = false;
    hasPlayerMoved = false; // フラグをリセット
}

// ゲーム開始
function startGame() {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    isGameActive = true;
    isGamePaused = false;
    hasPlayerMoved = false; // ここでもリセット
    loadLevel(currentLevel);
    // BGM再生
    bgm.play().catch(e => console.log("BGM再生エラー:", e)); // 自動再生ポリシー対応
}

// レベルの読み込み
function loadLevel(level) {
    clearInterval(gameInterval);
    clearInterval(itemDropInterval);
    clearInterval(levelTimerInterval);

    // 既存のアイテムを全て削除
    document.querySelectorAll('.item').forEach(item => item.remove());

    const levelSettings = levels[level];
    levelDisplay.textContent = level;
    timeLeft = levelSettings.time;
    score = 0; // 各レベルでスコアをリセット
    levelScore = 0; // 各レベルでレベルスコアもリセット
    updateDisplay();

    // プレイヤーの初期位置を中央に設定
    player.style.left = 'calc(50% - 30px)'; // プレイヤー幅60pxの半分を引く
    player.style.bottom = '10px'; // 下から10px
    player.style.width = '60px'; // プレイヤーの幅を初期値に戻す
    player.style.height = '60px'; // プレイヤーの高さを初期値に戻す


    // 背景画像の変更
    gameContainer.style.backgroundImage = `url('${levelSettings.bg}')`;

    // タイムゲージの初期化
    timeGauge.style.width = '100%';

    // アイテム落下を開始
    itemDropInterval = setInterval(dropItem, levelSettings.dropInterval);

    // タイムカウントダウンを開始
    levelTimerInterval = setInterval(() => {
        if (!isGameActive || isGamePaused) return;

        timeLeft--;
        updateDisplay();
        updateTimeGauge();

        if (timeLeft <= 0) {
            clearInterval(levelTimerInterval);
            clearInterval(itemDropInterval);
            endLevel();
        }
    }, 1000);
}

// アイテムの落下
function dropItem() {
    if (!isGameActive || isGamePaused) return;

    const item = document.createElement('img'); // img要素に変更
    item.classList.add('item');

    // ランダムなアイテムタイプを選択
    let itemType;
    const rand = Math.random();
    let cumulativeProbability = 0;
    const probabilities = levels[currentLevel].itemProbabilities;

    for (const type in probabilities) {
    cumulativeProbability += probabilities[type];
        if (rand < cumulativeProbability) {
            itemType = itemTypes[type];
            break;
        }
    }

    if (!itemType) { // 万が一選択されなかった場合のフォールバック
        itemType = itemTypes.iceCream;
    }

    item.src = itemType.src; // src属性を設定
    item.style.width = `${itemType.width}px`;
    item.style.height = `${itemType.height}px`;
    item.dataset.type = itemType.type; // アイテムの種類をデータ属性として保持

    const startLeft = Math.random() * (gameContainer.clientWidth - itemType.width);
    item.style.left = `${startLeft}px`;
    gameContainer.appendChild(item);

    let topPos = 0;
    const fallSpeed = 3; // 落下速度を調整

    const fallInterval = setInterval(() => {
        if (!isGameActive || isGamePaused) {
            clearInterval(fallInterval);
            return;
        }

        topPos += fallSpeed;
        item.style.top = `${topPos}px`;

        // プレイヤーとの衝突判定
        if (checkCollision(player, item)) {
            handleCollision(item, itemType);
            item.remove();
            clearInterval(fallInterval);
        } else if (topPos > gameContainer.clientHeight) {
            // 画面外に出たら削除
            item.remove();
            clearInterval(fallInterval);
            // 爆弾や時計以外のアイテムが画面外に出たらペナルティ
            if (itemType.type !== 'bomb' && itemType.type !== 'clock' && itemType.type !== 'powerUp') {
                score -= 5; // ペナルティ
                levelScore -= 5;
                updateDisplay();
            }
        }
    }, 20);
}

// 衝突判定
function checkCollision(playerElement, itemElement) {
    const playerRect = playerElement.getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();

    return !(
        playerRect.bottom < itemRect.top ||
        playerRect.top > itemRect.bottom ||
        playerRect.right < itemRect.left ||
        playerRect.left > itemRect.right
    );
}

// 衝突時の処理
function handleCollision(item, itemType) {
    if (itemType.type === 'bomb') {
        score += itemType.score;
        levelScore += itemType.score;
        sfxBomb.play();
        player.style.backgroundImage = 'url(\'player_bomb.png\')'; // プレイヤー画像を爆弾エフェクトに変更
        setTimeout(() => {
            player.style.backgroundImage = 'url(\'player.png\')'; // 元に戻す
        }, 300); // 0.3秒後に戻す
    } else if (itemType.type === 'clock') {
        timeLeft += itemType.timeBonus;
        if (timeLeft > levels[currentLevel].time) { // 最大時間を超えないように
            timeLeft = levels[currentLevel].time;
        }
        sfxClock.play();
    } else if (itemType.type === 'powerUp') {
        player.style.width = '80px';
        player.style.height = '80px';
        sfxPowerup.play();
        setTimeout(() => {
            player.style.width = '60px';
            player.style.height = '60px';
        }, 5000); // 5秒後に元のサイズに戻る
    } else if (itemType.type === 'goldenIce') {
        score += itemType.score;
        levelScore += itemType.score;
        sfxGoldenIce.play();
    } else {
        score += itemType.score;
        levelScore += itemType.score;
        sfxCatch.play();
    }
    updateDisplay();
}

// 表示の更新
function updateDisplay() {
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    level1ScoreDisplay.textContent = currentLevel === 1 ? levelScore : levels[1] ? levels[1].savedScore || 0 : 0;
    level2ScoreDisplay.textContent = currentLevel === 2 ? levelScore : levels[2] ? levels[2].savedScore || 0 : 0;
    level3ScoreDisplay.textContent = currentLevel === 3 ? levelScore : levels[3] ? levels[3].savedScore || 0 : 0;
    totalScoreDisplay.textContent = totalScore + levelScore; // 現在のレベルスコアも合計に含める
}

// タイムゲージの更新
function updateTimeGauge() {
    const levelMaxTime = levels[currentLevel].time;
    const percentage = (timeLeft / levelMaxTime) * 100;
    timeGauge.style.width = `${percentage}%`;
    if (percentage < 20) {
        timeGauge.style.backgroundColor = '#ff6b6b'; // 赤色
    } else if (percentage < 50) {
        timeGauge.style.backgroundColor = '#ffd166'; // 黄色
    } else {
        timeGauge.style.backgroundColor = '#70e000'; // 緑色
    }
}

// レベル終了処理
function endLevel() {
    isGameActive = false;
    clearInterval(gameInterval);
    clearInterval(itemDropInterval);
    clearInterval(levelTimerInterval);

    // 現在のレベルのスコアを保存
    levels[currentLevel].savedScore = levelScore;
    totalScore += levelScore; // 全体合計スコアを更新

    // 既存のアイテムを全て削除
    document.querySelectorAll('.item').forEach(item => item.remove());

    sfxLevelEnd.play(); // レベル終了SE再生

    // レベルクリア判定
    if (levelScore >= levels[currentLevel].requiredScore) {
        levelScoreDisplay.textContent = levelScore; // レベル終了画面に表示
        if (currentLevel < Object.keys(levels).length) {
            // 次のレベルへ
            levelEndScreen.style.display = 'flex';
            nextLevelButton.textContent = `レベル${currentLevel + 1}へ`; // ボタンテキスト更新
        } else {
            // 全レベルクリア
            finalScoreDisplay.textContent = totalScore; // 最終スコアに合計スコアを表示
            gameOverScreen.style.display = 'flex';
            restartButton.textContent = 'ゲームクリア！もう一度プレイ'; // テキスト変更
            sfxMst.play(); // 全クリアSE
        }
    } else {
        // スコア不足でゲームオーバー
        finalScoreDisplay.textContent = totalScore;
        gameOverScreen.style.display = 'flex';
        restartButton.textContent = 'もう一度プレイ';
    }

    updateDisplay(); // 合計スコアなどの表示を最終更新
    bgm.pause(); // BGM停止
}


// ゲームオーバー処理
function gameOver() {
    isGameActive = false;
    clearInterval(gameInterval);
    clearInterval(itemDropInterval);
    clearInterval(levelTimerInterval);
    document.querySelectorAll('.item').forEach(item => item.remove());
    finalScoreDisplay.textContent = totalScore;
    gameOverScreen.style.display = 'flex';
    bgm.pause(); // BGM停止
    bgm.currentTime = 0;
}

// イベントリスナー
startButton.addEventListener('click', startGame);
nextLevelButton.addEventListener('click', () => {
    currentLevel++;
    levelEndScreen.style.display = 'none';
    startGame(); // 次のレベルを開始
});
restartButton.addEventListener('click', initializeGame); // ゲームオーバー画面からリスタート

// プレイヤーの移動 (タッチイベント)
let touchStartX = 0;
let playerStartX = 0;

gameContainer.addEventListener('touchstart', (e) => {
    if (!isGameActive) return; // ゲームがアクティブでない場合は何もしない
    touchStartX = e.touches[0].clientX;
    playerStartX = player.offsetLeft;
    hasPlayerMoved = true; // タッチ開始で移動フラグを立てる
});

gameContainer.addEventListener('touchmove', (e) => {
    if (!isGameActive || !hasPlayerMoved) return; // ゲームがアクティブでないか、まだ移動開始していない場合は何もしない

    const touchCurrentX = e.touches[0].clientX;
    let newPlayerX = playerStartX + (touchCurrentX - touchStartX);

    // プレイヤーが画面外に出ないように制限
    if (newPlayerX < 0) {
        newPlayerX = 0;
    }
    if (newPlayerX > gameContainer.clientWidth - player.offsetWidth) {
        newPlayerX = gameContainer.clientWidth - player.offsetWidth;
    }
    player.style.left = `${newPlayerX}px`;
});

// ゲーム初期化ロジックの呼び出し
initializeGame();
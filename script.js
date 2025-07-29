--- script.js ---
window.onload = () => {
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');

    // Audio elements
    const bgm = document.getElementById('bgm');
    const sfxCatch = document.getElementById('sfx-catch');
    const sfxBomb = document.getElementById('sfx-bomb'); // 爆弾を削除しても、参照は残しておきます
    const sfxPowerup = document.getElementById('sfx-powerup');
    const sfxClock = document.getElementById('sfx-clock');
    const sfxGoldenIce = document.getElementById('sfx-golden-ice');
    const sfxLevelEnd = document.getElementById('sfx-level-end');
    const sfxBonus = document.getElementById('sfx-bonus');
    const sfxMst = document.getElementById('sfx-mst');

    // --- Game Sizing ---
    function setGameSize() {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        let containerHeight = vh;
        let containerWidth = containerHeight * (9 / 16);

        if (containerWidth > vw) {
            containerWidth = vw;
            containerHeight = containerWidth * (16 / 9);
        }

        gameContainer.style.height = `${containerHeight}px`;
        gameContainer.style.width = `${containerWidth}px`;

        // プレイヤーのサイズと位置をここで設定
        player.style.width = `${gameContainer.offsetWidth * 0.15}px`;
        player.style.height = `${gameContainer.offsetWidth * 0.15}px`;
        player.style.left = `${gameContainer.offsetWidth / 2 - player.offsetWidth / 2}px`;

        // プレイヤーのbottom位置をゲーム画面の最下部に固定
        player.style.bottom = `0px`; // 必ず0pxに設定
    }

    // --- Main Game Logic Initialization Function ---
    function initializeGameLogic() {
        console.log('initializeGameLogic started.');
        const scoreDisplay = document.getElementById('score-display');
        const timeDisplay = document.getElementById('time-display');
        const timeGauge = document.getElementById('time-gauge');
        const levelDisplay = document.getElementById('level-display');
        const level1ScoreDisplay = document.getElementById('level1-score-display');
        const level2ScoreDisplay = document.getElementById('level2-score-display');
        const level3ScoreDisplay = document.getElementById('level3-score-display');
        const totalScoreDisplay = document.getElementById('total-score-display');
        const levelEndScreen = document.getElementById('level-end-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const nextLevelButton = document.getElementById('next-level-button');
        const restartButton = document.getElementById('restart-button');
        const levelScoreDisplay = document.getElementById('level-score');
        const finalScoreDisplay = document.getElementById('final-score');

        let score = 0, level = 1, timeLeft = 60, gameSpeed = 0, powerupLevel = 0;
        let levelScores = [0, 0, 0], totalScore = 0;
        let powerupTimer = null; // powerupEndTime は不要に
        let gameInterval, timerInterval, itemInterval;
        let bonusCardSpawnedForLevel = false, superBombSpawnedCount = 0;
        let availableCards = [1, 2, 3], bonusScore = 0;
        let isReversed = false, reverseTimer = null;
        let isSlowed = false, slowTimer = null;
        let playerX = 0;

        const levels = {
            1: { baseSpeed: 6.0, spawnRate: 800, acceleration: 0.007, bg: 'bg-level-1.jpg', music: 'bgm-level-1' },
            2: { baseSpeed: 7.5, spawnRate: 650, acceleration: 0.010, bg: 'bg-level-2.jpg', music: 'bgm-level-2' },
            3: { baseSpeed: 9.0, spawnRate: 500, acceleration: 0.014, bg: 'bg-level-3.jpg', music: 'bgm-level-3' }
        };
        const MAX_LEVEL = Object.keys(levels).length;

        // 爆弾アイテムを完全に削除
        const items = [
            { type: 'ice-cream', score: 10, sfx: sfxCatch, soundName: 'catch', probability: 0.62, image: 'soft cream.png' },
            { type: 'golden-ice', emoji: '🌟', score: 50, sfx: sfxGoldenIce, soundName: 'golden', probability: 0.08 },
            { type: 'clock', emoji: '⏰', time: 5, sfx: sfxClock, soundName: 'clock', probability: 0.08 },
            { type: 'hamster', powerup: true, sfx: sfxPowerup, soundName: 'powerup', probability: 0.04, image: 'hamster.png' },
            { type: 'bonus-card', score: 1000, sfx: sfxBonus, soundName: 'bonus', probability: 0, image: '' },
            { type: 'super-bomb', emoji: '💣', score: -1000, sfx: sfxBomb, soundName: 'bomb', probability: 0 },
            { type: 'monster-1', image: 'mst-1.png', sfx: sfxMst, soundName: 'mst', probability: 0.01, debuff: { type: 'slow', duration: 3000 } },
            { type: 'monster-2', image: 'mst-2.png', sfx: sfxMst, soundName: 'mst', probability: 0.01, debuff: { type: 'reverse', duration: 5000 } }
        ];
        
        // 音源のパスをassetsフォルダ内に統一 (もしassets/soundsにある場合)
        // src属性を動的に変更するのではなく、audioタグに直接sourceを指定する方式
        // index.html の audio タグに src 属性を直接設定することを推奨します。
        // 例: <audio id="sfx-catch" src="assets/sounds/catch.mp3" preload="auto"></audio>
        // または、以下のようにJSで設定する場合（推奨はHTML）
        bgm.src = 'assets/sounds/bgm-level-1.mp3'; // デフォルトBGM
        sfxCatch.src = 'assets/sounds/catch.mp3';
        sfxBomb.src = 'assets/sounds/bomb.mp3'; // 爆弾を削除しても、sfxBombの参照は残しておきます
        sfxPowerup.src = 'assets/sounds/powerup.mp3';
        sfxClock.src = 'assets/sounds/clock.mp3';
        sfxGoldenIce.src = 'assets/sounds/golden.mp3';
        sfxLevelEnd.src = 'assets/sounds/clear.mp3';
        sfxBonus.src = 'assets/sounds/bonus.mp3';
        sfxMst.src = 'assets/sounds/mst.mp3';


        bgm.volume = 0.2;
        [sfxCatch, sfxPowerup, sfxClock, sfxGoldenIce, sfxLevelEnd, sfxBonus, sfxBomb, sfxMst].forEach(sfx => {
            if (sfx) sfx.volume = 0.7;
        });

        // playSound関数をシンプル化 (HTMLでsrcが設定されている前提)
        function playSound(audioElement) {
            if (!audioElement) return;
            audioElement.currentTime = 0; // 再生位置を最初に戻す
            audioElement.play().catch(e => { console.error("Audio play failed:", e); });
        };
        // playSound(audioElement, soundName) の soundName 引数は不要になる

        function playMusicForLevel(levelNum) {
            const musicBaseName = levels[levelNum].music;
            // playSound(bgm, musicBaseName); を以下のように変更
            bgm.src = `assets/sounds/${musicBaseName}.mp3`; // .oggもあれば追加
            bgm.load();
            bgm.play().catch(e => console.error("BGM play failed:", e));
        };

        function movePlayer(x) {
            const minX = 0;
            const maxX = gameContainer.offsetWidth - player.offsetWidth;
            playerX = Math.max(minX, Math.min(x, maxX));
            player.style.left = `${playerX}px`;
        };

        function handleMove(clientX) {
            const containerRect = gameContainer.getBoundingClientRect();
            let targetX = clientX - containerRect.left - player.offsetWidth / 2;
            if (isReversed) {
                const playerCenterX = playerX + player.offsetWidth / 2;
                const containerCenterX = gameContainer.offsetWidth / 2;
                targetX = containerCenterX - (targetX + player.offsetWidth / 2 - containerCenterX) - player.offsetWidth / 2;
            }
            movePlayer(targetX);
        };

        document.addEventListener('keydown', (e) => {
            if (isSlowed) return;
            let moveDistance = 20;
            let targetX = playerX;
            if (e.key === 'ArrowLeft') {
                targetX = isReversed ? playerX + moveDistance : playerX - moveDistance;
            } else if (e.key === 'ArrowRight') {
                targetX = isReversed ? playerX - moveDistance : playerX + moveDistance;
            }
            movePlayer(targetX);
        });

        gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isSlowed) return;
            handleMove(e.touches[0].clientX);
        }, { passive: false });

        gameContainer.addEventListener('mousemove', (e) => {
            if (e.buttons === 1 && !isSlowed) {
                handleMove(e.clientX);
            }
        });

        function createItem() {
            const canSpawnSuperBomb = level >= 2 && timeLeft < 30 && superBombSpawnedCount < 2 && Math.random() < 0.05;
            if (canSpawnSuperBomb) {
                const superBombData = items.find(i => i.type === 'super-bomb');
                if (superBombData) {
                    spawnItemElement(superBombData);
                    superBombSpawnedCount++;
                    return;
                }
            }

            if (!bonusCardSpawnedForLevel && timeLeft < 45 && timeLeft > 15 && Math.random() < 0.5) {
                spawnBonusCard();
                return;
            }

            const timeElapsed = 60 - timeLeft;
            // 爆弾の確率増加ロジックを削除
            // const bombProbabilityIncrease = (timeElapsed / 60) * 0.20; 

            const monsterProbability = (timeElapsed / 60) * 0.10 + (level - 1) * 0.05;

            const dynamicItems = items.map(item => {
                // if (item.type === 'bomb') { // 爆弾に関するロジックを削除
                //     return { ...item, probability: item.probability + bombProbabilityIncrease };
                // }
                if (item.type.startsWith('monster')) {
                    return { ...item, probability: monsterProbability / 2 };
                }
                return item;
            });

            const rand = Math.random();
            let cumulativeProbability = 0;
            // 'bomb'を除外するフィルタリングを追加
            const spawnableItems = dynamicItems.filter(item => item.type !== 'bonus-card' && item.type !== 'super-bomb' && item.type !== 'bomb');
            const totalSpawnableProbability = spawnableItems.reduce((sum, item) => sum + item.probability, 0);

            let selectedItem = null;
            for (const item of spawnableItems) {
                const normalizedProbability = item.probability / totalSpawnableProbability;
                cumulativeProbability += normalizedProbability;
                if (rand <= cumulativeProbability) {
                    selectedItem = item;
                    break;
                }
            }

            if (!selectedItem) {
                selectedItem = items.find(i => i.type === 'ice-cream');
            }

            spawnItemElement(selectedItem);
        };

        function spawnItemElement(itemData, cardId = null) {
            const itemElement = document.createElement('div');
            const currentContainerWidth = gameContainer.offsetWidth > 0 ? gameContainer.offsetWidth : window.innerWidth; // Fallback
            itemElement.classList.add('item', itemData.type);
            itemElement.dataset.type = itemData.type;
            itemElement.style.left = `${Math.random() * (currentContainerWidth - 60)}px`;
            itemElement.style.top = '-60px';

            if (cardId) {
                const img = document.createElement('img');
                img.src = `card-${cardId}.png`;
                itemElement.appendChild(img);
            } else if (itemData.image) {
                const img = document.createElement('img');
                img.src = itemData.image;
                itemElement.appendChild(img);
            } else if (itemData.emoji) {
                itemElement.innerText = itemData.emoji;
            }

            let movesHorizontally = false;
            let horizontalSpeed = 0;

            if (itemData.type.startsWith('monster')) {
                movesHorizontally = true;
                horizontalSpeed = 8 + level * 2;
            } else if (itemData.type === 'golden-ice' || itemData.type === 'hamster') {
                movesHorizontally = true;
                horizontalSpeed = 12;
            } else if (itemData.type === 'ice-cream' && level >= 2) {
                movesHorizontally = true;
                horizontalSpeed = 5;
            } 
            // 爆弾の水平移動ロジックを削除
            // else if (itemData.type === 'bomb' && level >= 3) { 
            //     movesHorizontally = true;
            //     horizontalSpeed = 7;
            // }

            if (movesHorizontally) {
                itemElement.dataset.horizontalSpeed = horizontalSpeed * (Math.random() * 0.5 + 0.75);
                itemElement.dataset.direction = Math.random() < 0.5 ? '1' : '-1';
            }
            
            if (itemData.type === 'bonus-card') {
                itemElement.classList.add('bonus-card');
                itemElement.style.top = '-80px';
                itemElement.style.left = `${gameContainer.offsetWidth / 2 - 40}px`;
                itemElement.dataset.startTime = Date.now();
                itemElement.dataset.startX = parseFloat(itemElement.style.left);
                itemElement.dataset.amplitude = (Math.random() * 200 + 150) * (Math.random() < 0.5 ? 1 : -1);
                itemElement.dataset.frequency = 0.001; // 固定値に変更
            }

            gameContainer.appendChild(itemElement);
        };

        function spawnBonusCard() {
            if (availableCards.length === 0) return;
            bonusCardSpawnedForLevel = true;
            const cardIndex = Math.floor(Math.random() * availableCards.length);
            const cardId = availableCards.splice(cardIndex, 1)[0];
            const cardItemData = items.find(i => i.type === 'bonus-card');
            spawnItemElement(cardItemData, cardId);
        };

        function gameLoop() {
            const timeElapsed = 60 - timeLeft;
            const timeSpeedIncrease = timeElapsed * levels[level].acceleration;
            const regularScore = score - bonusScore;
            const scoreSpeedIncrease = Math.floor(regularScore / 20) * 0.1;
            gameSpeed = levels[level].baseSpeed + timeSpeedIncrease + scoreSpeedIncrease;

            const allItems = document.querySelectorAll('.item');
            const playerRect = player.getBoundingClientRect();
            const containerWidth = gameContainer.offsetWidth;

            allItems.forEach(item => {
                let top = parseInt(item.style.top);
                let currentSpeed = gameSpeed;
                if (item.classList.contains('super-bomb')) {
                    currentSpeed *= 2.5;
                }

                if (item.classList.contains('bonus-card')) {
                    const startTime = parseFloat(item.dataset.startTime);
                    const timeElapsed = Date.now() - startTime;
                    const startX = parseFloat(item.dataset.startX);
                    const amplitude = parseFloat(item.dataset.amplitude);
                    const frequency = parseFloat(item.dataset.frequency);
                    top += currentSpeed * 1.5;
                    let left = startX + amplitude * Math.sin(timeElapsed * frequency);
                    item.style.left = `${left}px`;
                } else {
                    top += gameSpeed;
                    if (item.dataset.horizontalSpeed) {
                        let left = parseFloat(item.style.left);
                        let speed = parseFloat(item.dataset.horizontalSpeed);
                        let direction = parseInt(item.dataset.direction);
                        left += speed * direction;
                        if (left <= 0) { left = 0; direction = 1; }
                        else if (left >= containerWidth - item.offsetWidth) { left = containerWidth - item.offsetWidth; direction = -1; }
                        item.style.left = `${left}px`;
                        item.dataset.direction = direction;
                    }
                }
                item.style.top = `${top}px`;

                const itemRect = item.getBoundingClientRect();
                if (playerRect.left < itemRect.right && playerRect.right > itemRect.left && playerRect.top < itemRect.bottom && playerRect.bottom > itemRect.top) {
                    handleItemCatch(item);
                    item.remove();
                }

                if (top > gameContainer.offsetHeight) {
                    item.remove();
                }
            });
        };

        function handleItemCatch(item) {
            const type = item.dataset.type;
            const itemData = items.find(i => i.type === type);
            if (!itemData) return;

            // AudioContextでの再生を試みる
            if (itemData.sfx && itemData.soundName) {
                // playSound(itemData.sfx, itemData.soundName); // 古い呼び出しを削除
                // playSound関数は引数を一つしか取らないように変更されているため
                playSound(itemData.sfx);
            }

            if (type === 'bonus-card') {
                bonusScore += itemData.score;
                triggerFlashEffect();
            }

            if (itemData.score) { score += itemData.score; }
            if (itemData.time) { 
                timeLeft += itemData.time;
                if (timeLeft > 60) timeLeft = 60;
            }
            // ハムスターパワーアップの回数制限とサイズ調整
            if (itemData.powerup && powerupLevel < 2) { // 2回までに制限
                powerupLevel++;
                player.style.transform = `scale(${1 + powerupLevel * 0.2})`; // 拡大率を調整 (0.25 -> 0.2)
                
                // bottom位置の調整を削除 (transform-originで対応)
                // player.style.bottom = `${gameContainer.offsetHeight * 0.08 + (player.offsetHeight * (powerupLevel - 1) * 0.2)}px`; 
                
                if (powerupTimer) clearTimeout(powerupTimer);
                powerupTimer = setTimeout(() => {
                    powerupLevel = 0;
                    player.style.transform = 'scale(1)';
                    // player.style.bottom = `${gameContainer.offsetHeight * 0.08}px`; // 元の位置に戻すも削除
                }, 5000 * powerupLevel); // powerupEndTime - Date.now() ではなくシンプルに計算
            }
            
            if (itemData.debuff) {
                activateDebuff(itemData.debuff);
            }

            if (score < 0) score = 0;

            scoreDisplay.innerText = score;
            timeDisplay.innerText = timeLeft;
            levelScores[level - 1] = score;
            totalScore = levelScores.reduce((a, b) => a + b, 0);

            level1ScoreDisplay.innerText = levelScores[0];
            level2ScoreDisplay.innerText = levelScores[1];
            level3ScoreDisplay.innerText = levelScores[2];
            totalScoreDisplay.innerText = totalScore;
        };

        function activateDebuff(debuff) {
            const duration = debuff.duration ? debuff.duration + (level - 1) * 500 : undefined;

            if (debuff.type === 'slow') {
                isSlowed = true;
                player.style.backgroundImage = 'url(\'player-mono.png\')';
                if (slowTimer) clearTimeout(slowTimer);
                slowTimer = setTimeout(() => {
                    isSlowed = false;
                    player.style.backgroundImage = 'url(\'player.png\')';
                }, duration);
            }

            if (debuff.type === 'reverse') {
                isReversed = true;
                player.style.backgroundImage = 'url(\'player-mono.png\')';
                if (reverseTimer) clearTimeout(reverseTimer);
                reverseTimer = setTimeout(() => {
                    isReversed = false;
                    player.style.backgroundImage = 'url(\'player.png\')';
                }, duration);
            }
        };

        function triggerFlashEffect() {
            const flash = document.createElement('div');
            flash.classList.add('flash-effect');
            gameContainer.appendChild(flash);
            setTimeout(() => flash.remove(), 300);
        };

        function updateTimer() {
            timeLeft--;
            timeDisplay.innerText = timeLeft;
            const gaugeWidth = (timeLeft / 60) * 100;
            timeGauge.style.width = `${gaugeWidth}%`;
            if (timeLeft <= 0) {
                endLevel();
            }
        };

        function startLevel() {
            score = 0;
            bonusScore = 0;
            timeLeft = 60;
            levelDisplay.innerText = level;
            scoreDisplay.innerText = score;
            timeDisplay.innerText = timeLeft;
            timeGauge.style.width = '100%';
            gameSpeed = levels[level].baseSpeed;
            powerupLevel = 0;
            if (powerupTimer) clearTimeout(powerupTimer);
            bonusCardSpawnedForLevel = false;
            superBombSpawnedCount = 0;
            isReversed = false;
            isSlowed = false;
            if (reverseTimer) clearTimeout(reverseTimer);
            if (slowTimer) clearTimeout(slowTimer);
            
            player.style.transform = 'scale(1)';
            player.style.bottom = `0px`; // プレイヤーの位置を常に最下部に設定
            player.style.backgroundImage = 'url(\'player.png\')';

            playerX = gameContainer.offsetWidth / 2 - player.offsetWidth / 2;
            player.style.left = `${playerX}px`;

            const mainItem = items.find(i => i.type === 'ice-cream');
            if (mainItem) {
                // レベル3のアイスクリーム画像を「ice 2.png」に変更
                if (level === 1) { mainItem.image = 'soft cream.png'; mainItem.score = 10; }
                else if (level === 2) { mainItem.image = 'candy.png'; mainItem.score = 15; }
                else if (level === 3) { mainItem.image = 'ice 2.png'; mainItem.score = 20; } 
            }

            gameContainer.style.backgroundImage = `url('${levels[level].bg}')`;
            document.querySelectorAll('.item').forEach(i => i.remove());

            gameInterval = setInterval(gameLoop, 50);
            timerInterval = setInterval(updateTimer, 1000);
            itemInterval = setInterval(createItem, levels[level].spawnRate);
            playMusicForLevel(level); // BGM再生をstartLevelの最後に移動
        };

        function endLevel() {
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            clearInterval(itemInterval);
            bgm.pause();
            playSound(sfxLevelEnd); // 引数を修正

            levelScores[level - 1] = score;
            totalScore = levelScores.reduce((a, b) => a + b, 0);

            level1ScoreDisplay.innerText = levelScores[0];
            level2ScoreDisplay.innerText = levelScores[1];
            level3ScoreDisplay.innerText = levelScores[2];
            totalScoreDisplay.innerText = totalScore;

            if (level < MAX_LEVEL) {
                levelScoreDisplay.innerText = score;
                levelEndScreen.style.backgroundImage = `url('level-${level}.jpg')`;
                levelEndScreen.style.display = 'flex';
            } else {
                finalScoreDisplay.innerText = totalScore;
                gameOverScreen.style.backgroundImage = `url('final result.jpg')`;
                gameOverScreen.style.display = 'flex';
            }
        };
        
        startButton.addEventListener('click', () => {
            // iOSでの音声再生アンロックはすでに存在
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = audioContext.createBuffer(1, 1, 22050);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(0);
            
            startScreen.style.display = 'none';
            // startLevel() の中で playMusicForLevel が呼ばれるように変更
            startLevel(); 
        });

        nextLevelButton.addEventListener('click', () => {
            level++;
            levelEndScreen.style.display = 'none';
            // startLevel() の中で playMusicForLevel が呼ばれるように変更
            startLevel();
        });

        restartButton.addEventListener('click', () => {
            level = 1;
            levelScores = [0, 0, 0]; // スコアをリセット
            totalScore = 0;
            gameOverScreen.style.display = 'none';
            // startLevel() の中で playMusicForLevel が呼ばれるように変更
            startLevel();
        });

        // ページロード時にゲームサイズを初期設定
        setGameSize();
        // ウィンドウのリサイズ時にゲームサイズを再設定
        window.addEventListener('resize', setGameSize);

        // プレイヤーの初期画像を設定
        player.style.backgroundImage = 'url(\'player.png\')';

        // ゲームロジックをすぐに初期化（イベントリスナー等が設定される）
        initializeGameLogic();
    }
};
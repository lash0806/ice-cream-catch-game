window.onload = () => {
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');

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
        player.style.bottom = `${gameContainer.offsetHeight * 0.08}px`;
    }

    // --- Main Game Logic Initialization Function ---
    function initializeGameLogic() {
        const scoreDisplay = document.getElementById('score-display');
        const timeDisplay = document.getElementById('time-display');
        const timeGauge = document.getElementById('time-gauge');
        const levelDisplay = document.getElementById('level-display');
        const level1ScoreDisplay = document.getElementById('level1-score-display');
        const level2ScoreDisplay = document.getElementById('level2-score-display');
        const level3ScoreDisplay = document.getElementById('level3-score-display');
        const totalScoreDisplay = document.getElementById('total-score-display');
        const bgm = document.getElementById('bgm');
        const sfxCatch = document.getElementById('sfx-catch');
        const sfxBomb = document.getElementById('sfx-bomb');
        const sfxPowerup = document.getElementById('sfx-powerup');
        const sfxClock = document.getElementById('sfx-clock');
        const sfxGoldenIce = document.getElementById('sfx-golden-ice');
        const sfxLevelEnd = document.getElementById('sfx-level-end');
        const sfxBonus = document.getElementById('sfx-bonus');
        const sfxMst = document.getElementById('sfx-mst');
        const levelEndScreen = document.getElementById('level-end-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const nextLevelButton = document.getElementById('next-level-button');
        const restartButton = document.getElementById('restart-button');
        const levelScoreDisplay = document.getElementById('level-score');
        const finalScoreDisplay = document.getElementById('final-score');

        let score = 0, level = 1, timeLeft = 60, gameSpeed = 0, powerupLevel = 0;
        let levelScores = [0, 0, 0], totalScore = 0;
        let powerupTimer = null, powerupEndTime = 0;
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

        const items = [
            { type: 'ice-cream', score: 10, sfx: sfxCatch, soundName: 'catch', probability: 0.62, image: 'soft cream.png' },
            { type: 'golden-ice', emoji: '🌟', score: 50, sfx: sfxGoldenIce, soundName: 'golden', probability: 0.08 },
            { type: 'clock', emoji: '⏰', time: 5, sfx: sfxClock, soundName: 'clock', probability: 0.08 },
            { type: 'bomb', score: -20, sfx: sfxBomb, soundName: 'bomb', probability: 0.10, image: 'Eggplant.png' },
            { type: 'hamster', powerup: true, sfx: sfxPowerup, soundName: 'powerup', probability: 0.04, image: 'hamster.png' },
            { type: 'bonus-card', score: 1000, sfx: sfxBonus, soundName: 'bonus', probability: 0, image: '' },
            { type: 'super-bomb', emoji: '💣', score: -1000, sfx: sfxBomb, soundName: 'bomb', probability: 0 },
            { type: 'monster-1', image: 'mst-1.png', sfx: sfxMst, soundName: 'mst', probability: 0.01, debuff: { type: 'slow', duration: 3000 } },
            { type: 'monster-2', image: 'mst-2.png', sfx: sfxMst, soundName: 'mst', probability: 0.01, debuff: { type: 'reverse', duration: 5000 } }
        ];
        
        bgm.volume = 0.2;
        [sfxCatch, sfxPowerup, sfxClock, sfxGoldenIce, sfxLevelEnd, sfxBonus, sfxBomb, sfxMst].forEach(sfx => {
            if (sfx) sfx.volume = 0.7;
        });

        function movePlayer(x) {
            const minX = 0;
            const maxX = gameContainer.offsetWidth - player.offsetWidth;
            playerX = Math.max(minX, Math.min(x, maxX));
            player.style.left = `${playerX}px`;
        }

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

        function playSound(audioElement, soundName) {
            if (!audioElement) return;
            const oggSource = audioElement.querySelector('source[type="audio/ogg"]') || document.createElement('source');
            oggSource.src = `${soundName}.ogg`;
            oggSource.type = 'audio/ogg';
            const mp3Source = audioElement.querySelector('source[type="audio/mpeg"]') || document.createElement('source');
            mp3Source.src = `${soundName}.mp3`;
            mp3Source.type = 'audio/mpeg';
            audioElement.innerHTML = '';
            audioElement.appendChild(oggSource);
            audioElement.appendChild(mp3Source);
            audioElement.load();
            audioElement.play().catch(e => {});
        }

        function playMusicForLevel(levelNum) {
            const musicBaseName = levels[levelNum].music;
            playSound(bgm, musicBaseName);
        }

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
            const bombProbabilityIncrease = (timeElapsed / 60) * 0.20;
            const monsterProbability = (timeElapsed / 60) * 0.10 + (level - 1) * 0.05;

            const dynamicItems = items.map(item => {
                if (item.type === 'bomb') {
                    return { ...item, probability: item.probability + bombProbabilityIncrease };
                }
                if (item.type.startsWith('monster')) {
                    return { ...item, probability: monsterProbability / 2 };
                }
                return item;
            });

            const rand = Math.random();
            let cumulativeProbability = 0;
            const spawnableItems = dynamicItems.filter(item => item.type !== 'bonus-card' && item.type !== 'super-bomb');
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
        }

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
            } else if (itemData.type === 'bomb' && level >= 3) {
                movesHorizontally = true;
                horizontalSpeed = 7;
            }

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
        }

        function spawnBonusCard() {
            if (availableCards.length === 0) return;
            bonusCardSpawnedForLevel = true;
            const cardIndex = Math.floor(Math.random() * availableCards.length);
            const cardId = availableCards.splice(cardIndex, 1)[0];
            const cardItemData = items.find(i => i.type === 'bonus-card');
            spawnItemElement(cardItemData, cardId);
        }

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
        }

        function handleItemCatch(item) {
            const type = item.dataset.type;
            const itemData = items.find(i => i.type === type);
            if (!itemData) return;

            if (itemData.sfx && itemData.soundName) {
                playSound(itemData.sfx, itemData.soundName);
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
            if (itemData.powerup && powerupLevel < 3) {
                powerupLevel++;
                player.style.transform = `scale(${1 + powerupLevel * 0.5})`;
                player.style.bottom = `${gameContainer.offsetHeight * 0.08 + (player.offsetWidth * (powerupLevel - 1) * 0.5)}px`; // プレイヤーの位置を調整
                if (powerupTimer) clearTimeout(powerupTimer);
                powerupEndTime = Date.now() + (5000 * powerupLevel);
                powerupTimer = setTimeout(() => {
                    powerupLevel = 0;
                    player.style.transform = 'scale(1)';
                    player.style.bottom = `${gameContainer.offsetHeight * 0.08}px`;
                }, powerupEndTime - Date.now());
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
        }

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
        }

        function triggerFlashEffect() {
            const flash = document.createElement('div');
            flash.classList.add('flash-effect');
            gameContainer.appendChild(flash);
            setTimeout(() => flash.remove(), 300);
        }

        function updateTimer() {
            timeLeft--;
            timeDisplay.innerText = timeLeft;
            const gaugeWidth = (timeLeft / 60) * 100;
            timeGauge.style.width = `${gaugeWidth}%`;
            if (timeLeft <= 0) {
                endLevel();
            }
        }

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
            powerupEndTime = 0;
            bonusCardSpawnedForLevel = false;
            superBombSpawnedCount = 0;
            isReversed = false;
            isSlowed = false;
            if (reverseTimer) clearTimeout(reverseTimer);
            if (slowTimer) clearTimeout(slowTimer);
            
            player.style.transform = 'scale(1)';
            player.style.bottom = `${gameContainer.offsetHeight * 0.08}px`; // プレイヤーの位置を再設定
            player.style.backgroundImage = 'url(\'player.png\')';

            playerX = gameContainer.offsetWidth / 2 - player.offsetWidth / 2;
            player.style.left = `${playerX}px`;

            const mainItem = items.find(i => i.type === 'ice-cream');
            if (mainItem) {
                mainItem.image = `soft cream.png`;
                mainItem.score = 10;
                if (level === 2) { mainItem.image = 'candy.png'; mainItem.score = 15; }
                if (level === 3) { mainItem.image = 'ice 2.png'; mainItem.score = 20; }
            }

            gameContainer.style.backgroundImage = `url('${levels[level].bg}')`;
            document.querySelectorAll('.item').forEach(i => i.remove());

            gameInterval = setInterval(gameLoop, 50);
            timerInterval = setInterval(updateTimer, 1000);
            itemInterval = setInterval(createItem, levels[level].spawnRate);
        }

        function endLevel() {
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            clearInterval(itemInterval);
            bgm.pause();
            playSound(sfxLevelEnd, 'clear');

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
        }
        
        startButton.addEventListener('click', () => {
            startScreen.style.display = 'none';
            playMusicForLevel(level);
            startLevel();
        });

        nextLevelButton.addEventListener('click', () => {
            level++;
            levelEndScreen.style.display = 'none';
            playMusicForLevel(level);
            startLevel();
        });

        restartButton.addEventListener('click', () => {
            level = 1;
            levelScores = [0, 0, 0];
            totalScore = 0;
            availableCards = [1, 2, 3];
            gameOverScreen.style.display = 'none';
            playMusicForLevel(level);
            startLevel();
            level1ScoreDisplay.innerText = 0;
            level2ScoreDisplay.innerText = 0;
            level3ScoreDisplay.innerText = 0;
            totalScoreDisplay.innerText = 0;
        });

        startScreen.style.backgroundImage = "url('start.jpg')";
        player.style.backgroundImage = "url('player.png')";
        startButton.disabled = false;
        startButton.textContent = 'ゲームスタート！';
    }

    // Call setGameSize initially and on resize
    setGameSize();
    window.addEventListener('resize', setGameSize);

    // After setting initial size, call the main game logic initialization
    // A small timeout ensures the browser has rendered the new sizes before logic depends on them.
    setTimeout(initializeGameLogic, 100);
};
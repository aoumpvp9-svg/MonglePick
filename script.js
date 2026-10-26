/**
 * 몽글픽 (Mongle Pick) 🎀 - Cute Random Picker Application Logic
 * Pure Vanilla JavaScript with LocalStorage & Web Audio SFX
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Application State & Storage Keys
  // ==========================================================================
  const STORAGE_KEYS = {
    ITEMS: 'mongle_items_v1',
    HISTORY: 'mongle_history_v1',
    SETTINGS: 'mongle_settings_v1',
  };

  // Initial Sample Presets
  const PRESET_DATA = {
    lunch: ['초밥 🍣', '마라탕 🍲', '수제버거 🍔', '돈까스 🍛', '김치찌개 🥘', '파스타 🍝', '쌀국수 🍜', '비빔밥 🥗'],
    snack: ['아이스 아메리카노 ☕', '딸기 라떼 🍓', '바닐라빈 라떼 🍦', '소금빵 🥐', '크로플 🧇', '마카롱 🧁', '밀크티 🧋'],
    presenter: ['1조 민수 🙋‍♂️', '2조 지은 🙋‍♀️', '3조 찬우 🙋‍♂️', '4조 하은 🙋‍♀️', '5조 준혁 🙋‍♂️', '6조 서연 🙋‍♀️'],
    penalty: ['편의점 간식 쏘기 ☕', '엉덩이로 이름 쓰기 💃', '노래 한 곡 부르기 🎤', '귀여운 애교 3종 세트 🎀', '다음 회의 서기 당첨 📝', '간단한 스트레칭 리드 🧘'],
  };

  // State
  let state = {
    items: [], // Array of { id: string, name: string, isExcluded: boolean }
    history: [], // Array of { id: number, round: number, timestamp: string, winners: string[], wasExcluded: boolean }
    settings: {
      pickCount: 1,
      excludeWinners: true,
      allowDuplicates: false,
      soundEnabled: true,
    },
    isDrawing: false,
  };

  // Confirmation modal callback placeholder
  let pendingConfirmAction = null;

  // ==========================================================================
  // 2. DOM Elements
  // ==========================================================================
  // Mascot & Audio
  const mascotAvatar = document.getElementById('mascotAvatar');
  const mascotMessage = document.getElementById('mascotMessage');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');
  const helpBtn = document.getElementById('helpBtn');

  // Input & Settings
  const itemInput = document.getElementById('itemInput');
  const addItemBtn = document.getElementById('addItemBtn');
  const decCountBtn = document.getElementById('decCountBtn');
  const incCountBtn = document.getElementById('incCountBtn');
  const pickCountDisplay = document.getElementById('pickCountDisplay');
  const excludeWinnersCheckbox = document.getElementById('excludeWinnersCheckbox');
  const allowDuplicatesCheckbox = document.getElementById('allowDuplicatesCheckbox');

  // Items List
  const itemsCountBadge = document.getElementById('itemsCountBadge');
  const activeCountEl = document.getElementById('activeCount');
  const excludedCountEl = document.getElementById('excludedCount');
  const itemsContainer = document.getElementById('itemsContainer');
  const chipsGrid = document.getElementById('chipsGrid');
  const emptyListState = document.getElementById('emptyListState');
  const clearAllItemsBtn = document.getElementById('clearAllItemsBtn');
  const reincludeAllBtn = document.getElementById('reincludeAllBtn');

  // Draw Stage & CTA
  const drawBtn = document.getElementById('drawBtn');
  const rollingContent = document.getElementById('rollingContent');
  const rollProgressWrapper = document.getElementById('rollProgressWrapper');
  const rollProgressBar = document.getElementById('rollProgressBar');
  const resultShowcase = document.getElementById('resultShowcase');
  const resultCardsWrap = document.getElementById('resultCardsWrap');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const rerollBtn = document.getElementById('rerollBtn');

  // History
  const historyCountBadge = document.getElementById('historyCountBadge');
  const historyContainer = document.getElementById('historyContainer');
  const historyList = document.getElementById('historyList');
  const emptyHistoryState = document.getElementById('emptyHistoryState');
  const undoLastDrawBtn = document.getElementById('undoLastDrawBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Bulk Modal
  const bulkModal = document.getElementById('bulkModal');
  const bulkModalOpenBtn = document.getElementById('bulkModalOpenBtn');
  const closeBulkModalBtn = document.getElementById('closeBulkModalBtn');
  const cancelBulkBtn = document.getElementById('cancelBulkBtn');
  const confirmBulkBtn = document.getElementById('confirmBulkBtn');
  const bulkTextarea = document.getElementById('bulkTextarea');
  const bulkCountPreview = document.getElementById('bulkCountPreview');

  // Confirm Modal
  const confirmModal = document.getElementById('confirmModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmIcon = document.getElementById('confirmIcon');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmAcceptBtn = document.getElementById('confirmAcceptBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // Confetti Canvas
  const confettiCanvas = document.getElementById('confettiCanvas');

  // ==========================================================================
  // 3. Web Audio SFX Synthesizer (No external files needed)
  // ==========================================================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTickSound() {
    if (!state.settings.soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      const freq = 600 + Math.random() * 250;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // Audio error silently handled
    }
  }

  function playPopSound() {
    if (!state.settings.soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio error silently handled
    }
  }

  function playWinFanfare() {
    if (!state.settings.soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } catch {
      // Audio error silently handled
    }
  }

  // ==========================================================================
  // 4. Mascot Reaction Engine
  // ==========================================================================
  function setMascotExpression(expression, message) {
    if (message) {
      mascotMessage.textContent = message;
    }

    const eyeNormal = mascotAvatar.querySelector('.eye-normal');
    const eyeRolling = mascotAvatar.querySelector('.eye-rolling');
    const eyeHappy = mascotAvatar.querySelector('.eye-happy');
    const mouthNormal = mascotAvatar.querySelector('.mouth-normal');
    const mouthOpen = mascotAvatar.querySelector('.mouth-open');

    // Reset display
    eyeNormal.style.display = 'none';
    eyeRolling.style.display = 'none';
    eyeHappy.style.display = 'none';
    mouthNormal.style.display = 'none';
    mouthOpen.style.display = 'none';

    mascotAvatar.classList.remove('rolling', 'happy');

    if (expression === 'rolling') {
      eyeRolling.style.display = 'block';
      mouthOpen.style.display = 'block';
      mascotAvatar.classList.add('rolling');
    } else if (expression === 'happy') {
      eyeHappy.style.display = 'block';
      mouthOpen.style.display = 'block';
      mascotAvatar.classList.add('happy');
    } else {
      // normal
      eyeNormal.style.display = 'block';
      mouthNormal.style.display = 'block';
    }
  }

  // ==========================================================================
  // 5. Toast Notification System
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '🎀';
    if (type === 'error') icon = '⚠️';
    if (type === 'success') icon = '✨';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.9)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ==========================================================================
  // 6. Confetti Particle System
  // ==========================================================================
  const confettiCtx = confettiCanvas.getContext('2d');
  let confettiParticles = [];
  let confettiAnimationId = null;

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas);
  resizeConfettiCanvas();

  function triggerConfetti() {
    resizeConfettiCanvas();
    confettiParticles = [];

    const colors = ['#ff85b3', '#9d84f6', '#fed7aa', '#a5e3d7', '#ffd166', '#c4b5fd', '#f472b6'];
    const count = 90;

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.4 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 12 - 6,
        size: Math.random() * 9 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'circle' : 'rect',
        opacity: 1,
        decay: Math.random() * 0.012 + 0.008,
      });
    }

    if (!confettiAnimationId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // air drag
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      if (p.opacity > 0) {
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = Math.max(0, p.opacity);
        confettiCtx.fillStyle = p.color;

        if (p.shape === 'circle') {
          confettiCtx.beginPath();
          confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          confettiCtx.fill();
        } else {
          confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }

        confettiCtx.restore();
      }
    });

    confettiParticles = confettiParticles.filter((p) => p.opacity > 0 && p.y < confettiCanvas.height);

    if (confettiParticles.length > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimationId = null;
    }
  }

  // ==========================================================================
  // 7. Local Storage Sync & Initial Load
  // ==========================================================================
  function loadFromStorage() {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedItems) {
        state.items = JSON.parse(storedItems);
      } else {
        // Initial default items for a delightful first impression!
        state.items = [
          { id: 'item_1', name: '초밥 🍣', isExcluded: false },
          { id: 'item_2', name: '마라탕 🍲', isExcluded: false },
          { id: 'item_3', name: '수제버거 🍔', isExcluded: false },
          { id: 'item_4', name: '김치찌개 🥘', isExcluded: false },
          { id: 'item_5', name: '파스타 🍝', isExcluded: false },
        ];
      }

      if (storedHistory) {
        state.history = JSON.parse(storedHistory);
      }

      if (storedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(storedSettings) };
      }
    } catch (e) {
      console.warn('Storage read warning, falling back to clean defaults:', e);
      state.items = [];
      state.history = [];
    }
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(state.items));
    } catch (e) {
      console.error('Failed to save items to localStorage', e);
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  // ==========================================================================
  // 8. Items Management Logic
  // ==========================================================================
  function addItem(rawName, suppressToast = false) {
    const cleanName = (rawName || '').trim();

    if (!cleanName) {
      if (!suppressToast) showToast('등록할 항목 이름을 입력해 주세요! 🎀', 'error');
      return false;
    }

    // Check duplicate if not allowed
    if (!state.settings.allowDuplicates) {
      const isDuplicate = state.items.some(
        (it) => it.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (isDuplicate) {
        if (!suppressToast) showToast(`'${cleanName}' 항목은 이미 등록되어 있어요! ⚠️`, 'error');
        return false;
      }
    }

    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      isExcluded: false,
    };

    state.items.push(newItem);
    saveItems();
    playPopSound();
    return true;
  }

  function removeItem(id) {
    const target = state.items.find((it) => it.id === id);
    if (!target) return;

    state.items = state.items.filter((it) => it.id !== id);
    saveItems();
    playPopSound();
    renderAll();
    showToast(`'${target.name}' 항목을 삭제했어요! 🗑️`);
  }

  function toggleItemExclusion(id) {
    const target = state.items.find((it) => it.id === id);
    if (!target) return;

    target.isExcluded = !target.isExcluded;
    saveItems();
    playPopSound();
    renderAll();

    const statusMsg = target.isExcluded ? '추첨 대상에서 제외했어요 ⏸️' : '다시 추첨 대상에 포함했어요 ✨';
    showToast(`'${target.name}'을(를) ${statusMsg}`);
  }

  function reincludeAllItems() {
    let count = 0;
    state.items.forEach((it) => {
      if (it.isExcluded) {
        it.isExcluded = false;
        count++;
      }
    });

    if (count > 0) {
      saveItems();
      playPopSound();
      renderAll();
      showToast(`제외되었던 ${count}개 항목을 모두 후보로 복구했어요! 🔄`, 'success');
      setMascotExpression('normal', `후보 ${count}개가 다시 포함되었어요! 무엇을 뽑을까요? ✨`);
    } else {
      showToast('제외된 항목이 없습니다.');
    }
  }

  function clearAllItems() {
    if (state.items.length === 0) {
      showToast('삭제할 항목이 없습니다 🎈');
      return;
    }

    openConfirmModal(
      '🗑️ 등록된 후보 전체 삭제',
      `현재 등록된 ${state.items.length}개 항목을 모두 삭제하시겠습니까?`,
      '⚠️',
      () => {
        state.items = [];
        saveItems();
        playPopSound();
        renderAll();
        showToast('모든 후보 항목이 삭제되었습니다.');
        setMascotExpression('normal', '새로운 후보 항목들을 등록해 주세요! 📝');
      }
    );
  }

  // ==========================================================================
  // 9. Draw (Lottery) Core Logic
  // ==========================================================================
  function executeDraw() {
    if (state.isDrawing) return;

    // 1. Validation checks
    if (state.items.length === 0) {
      showToast('추첨할 후보 항목을 먼저 추가해 주세요! 🎀', 'error');
      setMascotExpression('normal', '추첨할 항목이 없어요! 위의 입력창에서 추가해 줘~ 🥺');
      itemInput.focus();
      return;
    }

    const activePool = state.items.filter((it) => !it.isExcluded);

    if (activePool.length === 0) {
      showToast('모든 후보가 이미 당첨되어 제외되었어요! 제외 복구를 눌러주세요 🔄', 'error');
      setMascotExpression('normal', '남은 후보가 없어요! "제외 항목 복구" 버튼을 눌러줘~ 🔄');
      return;
    }

    const pickCount = state.settings.pickCount;
    if (pickCount > activePool.length) {
      showToast(
        `추첨 인원(${pickCount}명)이 남은 후보(${activePool.length}명)보다 많아요! 인원을 조절해 주세요.`,
        'error'
      );
      setMascotExpression('normal', `남은 후보는 ${activePool.length}명이에요! 당첨 인원을 줄여봐~ 🎯`);
      return;
    }

    // 2. Begin Drawing Sequence
    state.isDrawing = true;
    drawBtn.disabled = true;
    resultShowcase.style.display = 'none';
    rollProgressWrapper.style.display = 'block';
    rollingContent.classList.add('is-rolling');

    setMascotExpression('rolling', '두근두근... 과연 누구일까?! 🎲✨');

    // Slot machine shuffle animation for ~1.8 seconds
    const durationMs = 1800;
    const intervalMs = 60;
    let elapsed = 0;

    const rollInterval = setInterval(() => {
      elapsed += intervalMs;
      const progressPercent = Math.min(100, Math.round((elapsed / durationMs) * 100));
      rollProgressBar.style.width = `${progressPercent}%`;

      // Pick a random candidate from active pool to preview
      const previewCandidate = activePool[Math.floor(Math.random() * activePool.length)];
      rollingContent.textContent = previewCandidate.name;
      playTickSound();

      if (elapsed >= durationMs) {
        clearInterval(rollInterval);
        finalizeDraw(activePool, pickCount);
      }
    }, intervalMs);
  }

  function finalizeDraw(activePool, pickCount) {
    // 1. Fair Fisher-Yates Shuffle on active pool
    const poolCopy = [...activePool];
    for (let i = poolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
    }

    // Selected winners
    const winners = poolCopy.slice(0, pickCount);
    const winnerNames = winners.map((w) => w.name);

    // 2. Mark excluded if option is enabled
    if (state.settings.excludeWinners) {
      const winnerIds = new Set(winners.map((w) => w.id));
      state.items.forEach((it) => {
        if (winnerIds.has(it.id)) {
          it.isExcluded = true;
        }
      });
      saveItems();
    }

    // 3. Record in Draw History
    const now = new Date();
    const timeFormatted = `${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const roundNumber = state.history.length + 1;

    const historyEntry = {
      id: Date.now(),
      round: roundNumber,
      timestamp: timeFormatted,
      winners: winnerNames,
      winnerIds: winners.map((w) => w.id),
      wasExcluded: state.settings.excludeWinners,
    };

    state.history.unshift(historyEntry);
    saveHistory();

    // 4. Update UI Display
    state.isDrawing = false;
    drawBtn.disabled = false;
    rollProgressWrapper.style.display = 'none';
    rollingContent.classList.remove('is-rolling');

    if (winners.length === 1) {
      rollingContent.textContent = `🎉 ${winners[0].name} 🎉`;
    } else {
      rollingContent.textContent = `🎉 총 ${winners.length}명 당첨! 🎉`;
    }

    // Render result cards
    renderResultCards(winners);
    resultShowcase.style.display = 'block';

    // Mascot & Celebrations
    setMascotExpression('happy', `와아! 축하해요! 몽글이가 행운의 당첨자를 뽑았어요! 💖`);
    triggerConfetti();
    playWinFanfare();

    renderAll();
  }

  function renderResultCards(winners) {
    resultCardsWrap.innerHTML = '';
    const medals = ['🥇 1등', '🥈 2등', '🥉 3등', '🌸 4등', '🎀 5등'];

    winners.forEach((winner, index) => {
      const card = document.createElement('div');
      card.className = 'winner-card';
      card.style.animationDelay = `${index * 0.12}s`;

      const badgeLabel = winners.length > 1 ? (medals[index] || `✨ ${index + 1}등`) : '👑 당첨자';

      card.innerHTML = `
        <div class="winner-badge">${badgeLabel}</div>
        <div class="winner-name">${escapeHtml(winner.name)}</div>
      `;
      resultCardsWrap.appendChild(card);
    });
  }

  // ==========================================================================
  // 10. History Actions & Undo
  // ==========================================================================
  function undoLastDraw() {
    if (state.history.length === 0) {
      showToast('취소할 최근 추첨 기록이 없어요 🎈');
      return;
    }

    const lastEntry = state.history.shift(); // Remove newest entry

    // Restore excluded winners if they were excluded
    if (lastEntry.wasExcluded && lastEntry.winnerIds) {
      const idsToRestore = new Set(lastEntry.winnerIds);
      state.items.forEach((it) => {
        if (idsToRestore.has(it.id)) {
          it.isExcluded = false;
        }
      });
      saveItems();
    }

    saveHistory();
    playPopSound();
    renderAll();

    // Reset result showcase if shown
    resultShowcase.style.display = 'none';
    rollingContent.innerHTML = `<span class="rolling-placeholder">준비 완료! 버튼을 눌러주세요 🎀</span>`;

    showToast(`제${lastEntry.round}회 추첨이 취소되고 후보가 복구되었어요! ↩️`, 'success');
    setMascotExpression('normal', `최근 추첨을 취소하고 후보를 복구했어요! 다시 뽑아볼까요? ✨`);
  }

  function clearHistory() {
    if (state.history.length === 0) {
      showToast('삭제할 추첨 기록이 없어요 🎈');
      return;
    }

    openConfirmModal(
      '📜 추첨 기록 전체 삭제',
      `총 ${state.history.length}회의 추첨 기록을 모두 삭제하시겠습니까?`,
      '🗑️',
      () => {
        state.history = [];
        saveHistory();
        playPopSound();
        renderAll();
        showToast('추첨 기록이 모두 초기화되었습니다.');
      }
    );
  }

  // ==========================================================================
  // 11. Copy to Clipboard
  // ==========================================================================
  function copyResultsToClipboard() {
    if (state.history.length === 0) {
      showToast('복사할 추첨 결과가 없어요!');
      return;
    }

    const latest = state.history[0];
    const textToCopy = `[몽글픽 (Mongle Pick) 추첨 결과 🎀]\n` +
      `🎉 당첨자: ${latest.winners.join(', ')}\n` +
      `⏰ 추첨 일시: ${latest.timestamp}\n` +
      `🐾 몽글이가 공정하게 추첨했습니다!`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        playPopSound();
        showToast('클립보드에 결과가 쏙 복사되었어요! 📋', 'success');
      })
      .catch(() => {
        showToast('복사에 실패했습니다. 수동으로 복사해 주세요.');
      });
  }

  // ==========================================================================
  // 12. Modal Handlers (Bulk & Confirm)
  // ==========================================================================
  function openBulkModal() {
    bulkTextarea.value = '';
    updateBulkCountPreview();
    bulkModal.classList.add('active');
    setTimeout(() => bulkTextarea.focus(), 150);
  }

  function closeBulkModal() {
    bulkModal.classList.remove('active');
  }

  function updateBulkCountPreview() {
    const lines = bulkTextarea.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    bulkCountPreview.textContent = `인식된 유효 항목: ${lines.length}개`;
  }

  function submitBulkItems() {
    const lines = bulkTextarea.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showToast('추가할 항목이 입력되지 않았어요!', 'error');
      return;
    }

    let addedCount = 0;
    lines.forEach((name) => {
      if (addItem(name, true)) {
        addedCount++;
      }
    });

    closeBulkModal();
    renderAll();

    if (addedCount > 0) {
      showToast(`총 ${addedCount}개 항목이 성공적으로 등록되었어요! ✨`, 'success');
      setMascotExpression('normal', `${addedCount}개의 항목이 추가되었어요! 이제 추첨해 볼까요? 🎲`);
    } else {
      showToast('중복되거나 유효하지 않아 등록된 항목이 없어요.', 'error');
    }
  }

  function openConfirmModal(title, message, icon, onAccept) {
    confirmModalTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmIcon.textContent = icon || '⚠️';
    pendingConfirmAction = onAccept;
    confirmModal.classList.add('active');
  }

  function closeConfirmModal() {
    confirmModal.classList.remove('active');
    pendingConfirmAction = null;
  }

  // ==========================================================================
  // 13. Render Functions
  // ==========================================================================
  function renderAll() {
    renderItemsList();
    renderHistoryList();
    updateControls();
  }

  function renderItemsList() {
    const total = state.items.length;
    const active = state.items.filter((it) => !it.isExcluded).length;
    const excluded = total - active;

    itemsCountBadge.textContent = `${total}개`;
    activeCountEl.textContent = active;
    excludedCountEl.textContent = excluded;

    // Toggle exclusion recovery button
    reincludeAllBtn.style.display = excluded > 0 ? 'inline-flex' : 'none';

    // Empty list state
    if (total === 0) {
      emptyListState.style.display = 'flex';
      chipsGrid.innerHTML = '';
      return;
    }

    emptyListState.style.display = 'none';
    chipsGrid.innerHTML = '';

    state.items.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = `item-chip ${item.isExcluded ? 'is-excluded' : ''}`;
      
      const statusBadge = item.isExcluded ? '<span class="excluded-badge">제외됨</span>' : '';
      const toggleLabel = item.isExcluded ? '포함' : '제외';

      chip.innerHTML = `
        <span class="chip-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        ${statusBadge}
        <button type="button" class="chip-toggle-btn" title="추첨 대상 전환" data-toggle-id="${item.id}">
          ${toggleLabel}
        </button>
        <button type="button" class="chip-delete-btn" title="항목 삭제" data-delete-id="${item.id}" aria-label="삭제">
          ✕
        </button>
      `;

      chipsGrid.appendChild(chip);
    });

    // Delegate chip events
    chipsGrid.querySelectorAll('.chip-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        removeItem(id);
      });
    });

    chipsGrid.querySelectorAll('.chip-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-toggle-id');
        toggleItemExclusion(id);
      });
    });
  }

  function renderHistoryList() {
    const count = state.history.length;
    historyCountBadge.textContent = `${count}회`;

    if (count === 0) {
      emptyHistoryState.style.display = 'flex';
      historyList.innerHTML = '';
      return;
    }

    emptyHistoryState.style.display = 'none';
    historyList.innerHTML = '';

    state.history.forEach((entry) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';

      const winnerTags = entry.winners
        .map((w) => `<span class="history-winner-tag">👑 ${escapeHtml(w)}</span>`)
        .join('');

      itemEl.innerHTML = `
        <div class="history-meta">
          <span class="history-round">🎯 제${entry.round}회 추첨</span>
          <span class="history-time">${entry.timestamp}</span>
        </div>
        <div class="history-winners">${winnerTags}</div>
      `;

      historyList.appendChild(itemEl);
    });
  }

  function updateControls() {
    pickCountDisplay.textContent = `${state.settings.pickCount}명`;
    excludeWinnersCheckbox.checked = state.settings.excludeWinners;
    allowDuplicatesCheckbox.checked = state.settings.allowDuplicates;

    // Sound toggle state
    if (state.settings.soundEnabled) {
      soundIcon.textContent = '🔔';
      soundLabel.textContent = '효과음 ON';
    } else {
      soundIcon.textContent = '🔕';
      soundLabel.textContent = '효과음 OFF';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================================================================
  // 14. Event Listeners Setup
  // ==========================================================================
  function setupEventListeners() {
    // Single item add form
    addItemBtn.addEventListener('click', () => {
      if (addItem(itemInput.value)) {
        itemInput.value = '';
        renderAll();
      }
      itemInput.focus();
    });

    itemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (addItem(itemInput.value)) {
          itemInput.value = '';
          renderAll();
        }
      }
    });

    // Preset chips
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        const items = PRESET_DATA[presetKey];
        if (!items) return;

        openConfirmModal(
          `✨ '${btn.textContent.trim()}' 세트 불러오기`,
          `기존 목록에 추천 세트(${items.length}개)를 추가할까요?`,
          '🎁',
          () => {
            let added = 0;
            items.forEach((name) => {
              if (addItem(name, true)) added++;
            });
            renderAll();
            showToast(`추천 세트 ${added}개 항목을 추가했어요! 🍱`, 'success');
            setMascotExpression('normal', `'${btn.textContent.trim()}' 세트 준비 완료! 추첨해 볼까요? 🎲`);
          }
        );
      });
    });

    // Pick Count Stepper (1 ~ 5)
    decCountBtn.addEventListener('click', () => {
      if (state.settings.pickCount > 1) {
        state.settings.pickCount--;
        saveSettings();
        playPopSound();
        updateControls();
      }
    });

    incCountBtn.addEventListener('click', () => {
      if (state.settings.pickCount < 5) {
        state.settings.pickCount++;
        saveSettings();
        playPopSound();
        updateControls();
      } else {
        showToast('한 번에 최대 5명까지 추첨할 수 있어요! 🎯');
      }
    });

    // Checkboxes
    excludeWinnersCheckbox.addEventListener('change', (e) => {
      state.settings.excludeWinners = e.target.checked;
      saveSettings();
      playPopSound();
    });

    allowDuplicatesCheckbox.addEventListener('change', (e) => {
      state.settings.allowDuplicates = e.target.checked;
      saveSettings();
      playPopSound();
    });

    // Sound toggle
    soundToggleBtn.addEventListener('click', () => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
      saveSettings();
      updateControls();
      if (state.settings.soundEnabled) {
        playPopSound();
        showToast('효과음이 켜졌어요! 🔔');
      } else {
        showToast('효과음이 꺼졌어요! 🔕');
      }
    });

    // Help button
    helpBtn.addEventListener('click', () => {
      showToast('항목을 등록하고 [두근두근 추첨하기]를 누르면 공정하게 뽑아줘요! 🎀');
      setMascotExpression('happy', '궁금한 점이 있으면 언제든 물어봐! 내가 친절히 도와줄게~ 🐾');
    });

    // Draw buttons
    drawBtn.addEventListener('click', executeDraw);
    rerollBtn.addEventListener('click', executeDraw);

    // List buttons
    clearAllItemsBtn.addEventListener('click', clearAllItems);
    reincludeAllBtn.addEventListener('click', reincludeAllItems);

    // History buttons
    undoLastDrawBtn.addEventListener('click', undoLastDraw);
    clearHistoryBtn.addEventListener('click', clearHistory);
    copyResultBtn.addEventListener('click', copyResultsToClipboard);

    // Bulk modal
    bulkModalOpenBtn.addEventListener('click', openBulkModal);
    closeBulkModalBtn.addEventListener('click', closeBulkModal);
    cancelBulkBtn.addEventListener('click', closeBulkModal);
    confirmBulkBtn.addEventListener('click', submitBulkItems);
    bulkTextarea.addEventListener('input', updateBulkCountPreview);

    // Confirmation modal
    confirmCancelBtn.addEventListener('click', closeConfirmModal);
    confirmAcceptBtn.addEventListener('click', () => {
      if (typeof pendingConfirmAction === 'function') {
        pendingConfirmAction();
      }
      closeConfirmModal();
    });

    // Close modals on clicking overlay background or pressing ESC
    [bulkModal, confirmModal].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        bulkModal.classList.remove('active');
        confirmModal.classList.remove('active');
      }
    });

    // Mascot click fun interaction
    mascotAvatar.addEventListener('click', () => {
      playPopSound();
      const funMessages = [
        '간지러워요! 에헤헤~ 🐰💖',
        '행운의 요정 몽글이가 대기 중이에요! ✨',
        '두근두근! 좋은 결과가 나올 거예요 🍀',
        '몽글픽과 함께 신나는 결정을 내려봐요! 🐾',
      ];
      const randomMsg = funMessages[Math.floor(Math.random() * funMessages.length)];
      setMascotExpression('happy', randomMsg);
      setTimeout(() => {
        if (!state.isDrawing) setMascotExpression('normal');
      }, 2500);
    });
  }

  // ==========================================================================
  // 15. App Initialization
  // ==========================================================================
  loadFromStorage();
  renderAll();
  setupEventListeners();

  // Welcome mascot greeting
  setTimeout(() => {
    setMascotExpression('normal', '안녕! 나는 몽글이야 🐾 오늘 무엇을 뽑아볼까? ✨');
  }, 400);
});

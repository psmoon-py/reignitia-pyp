(function() {
  // 1. Custom cursor
  const cursorEl = document.getElementById('cursor');
  if (cursorEl) {
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      cursorEl.style.left = cursorX + 'px';
      cursorEl.style.top = cursorY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
    // Hover state
    const hoverables = document.querySelectorAll('a, button, input, select, textarea, [data-hoverable]');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => cursorEl.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorEl.classList.remove('hover'));
    });
  }

  // 2. Background particle field
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas && bgCanvas.getContext) {
    const bgCtx = bgCanvas.getContext('2d');
    function resizeBg() {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = Math.max(window.innerHeight, document.documentElement.scrollHeight || 0);
    }
    resizeBg();
    window.addEventListener('resize', resizeBg);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * bgCanvas.width;
        this.y = Math.random() * bgCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.3 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
      }
      draw() {
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = 'rgba(155, 107, 204,' + this.opacity + ')';
        bgCtx.fill();
      }
    }

    const particles = Array.from({ length: 120 }, () => new Particle());
    function animateBg() {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateBg);
    }
    animateBg();
  }

  // 3. 3D breathing sphere (Three.js)
  const breathCanvas = document.getElementById('breathing-canvas');
  if (breathCanvas && window.THREE) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, breathCanvas.clientWidth / 500, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: breathCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(breathCanvas.clientWidth, 500);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(4, 6, 5);
    scene.add(directional);

    const coreGeo = new THREE.SphereGeometry(1, 64, 64);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x32b8c6,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.5,
      transparent: true,
      opacity: 0.9,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const haloGeo = new THREE.SphereGeometry(1.2, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x9b6bcc,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // Floating particles around sphere
    const pGeo = new THREE.BufferGeometry();
    const pCount = 400;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 6;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xe8f1f5,
      transparent: true,
      opacity: 0.7
    });
    const stars = new THREE.Points(pGeo, pMat);
    scene.add(stars);

    camera.position.z = 4.2;

    let breathingActive = false;
    let breathPhase = 0;
    let secondsLeft = 4;
    let phaseInterval = null;

    const phases = [
      { label: 'Breathe In', scale: 1.8 },
      { label: 'Hold', scale: 1.9 },
      { label: 'Breathe Out', scale: 1.0 },
      { label: 'Hold', scale: 1.0 }
    ];

    const instructionEl = document.getElementById('breath-instruction');
    const timerEl = document.getElementById('breath-timer');
    const startBtn = document.getElementById('start-breathing');
    const stopBtn = document.getElementById('stop-breathing');

    function setPhase(index) {
      breathPhase = index;
      secondsLeft = 4;
      if (instructionEl) instructionEl.textContent = phases[index].label;
      if (timerEl) timerEl.textContent = String(secondsLeft);
    }

    function startBreathing() {
      if (breathingActive) return;
      breathingActive = true;
      setPhase(0);
      if (startBtn && stopBtn) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
      }
      phaseInterval = setInterval(() => {
        secondsLeft -= 1;
        if (timerEl) timerEl.textContent = String(secondsLeft);
        if (secondsLeft <= 0) {
          const next = (breathPhase + 1) % phases.length;
          setPhase(next);
        }
      }, 1000);
    }

    function stopBreathing() {
      breathingActive = false;
      if (phaseInterval) {
        clearInterval(phaseInterval);
        phaseInterval = null;
      }
      if (instructionEl) instructionEl.textContent = 'Click Start to Begin';
      if (timerEl) timerEl.textContent = '4';
      if (startBtn && stopBtn) {
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
      }
    }

    if (startBtn) startBtn.addEventListener('click', startBreathing);
    if (stopBtn) stopBtn.addEventListener('click', stopBreathing);

    function animate() {
      requestAnimationFrame(animate);
      core.rotation.y += 0.003;
      halo.rotation.y -= 0.002;
      halo.rotation.x += 0.001;
      stars.rotation.y += 0.0008;

      const targetScale = breathingActive ? phases[breathPhase].scale : 1.0;
      const haloScale = breathingActive ? phases[breathPhase].scale + 0.25 : 1.25;
      core.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.04);
      halo.scale.lerp(new THREE.Vector3(haloScale, haloScale, haloScale), 0.04);

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const width = breathCanvas.clientWidth || breathCanvas.parentElement.clientWidth || window.innerWidth;
      const height = 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);
  }

  // 4. Crisis localization + country selection
  const countrySelect = document.getElementById('country-select');
  const locationModal = document.getElementById('location-modal');
  const confirmLocationBtn = document.getElementById('confirm-location');
  const changeCountryBtn = document.getElementById('change-country-btn');

  const crisisTitleEl = document.getElementById('crisis-title');
  const crisisDescEl = document.getElementById('crisis-desc');
  const crisisBtnEl = document.getElementById('crisis-main-btn');
  const crisisSubtextEl = document.getElementById('crisis-subtext');
  const resourceLinksEl = document.getElementById('resource-link-container');

  if (countrySelect && locationModal) {
    const allCountries = [
      'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
      'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
      'Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Congo (Democratic Republic)','Congo (Republic)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
      'Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
      'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
      'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
      'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan',
      'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
      'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Macedonia','Norway','Oman',
      'Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
      'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
      'Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
      'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
    ];

    const helplines = {
      'United States': { number: '988', buttonText: 'Call or Text 988', url: 'https://988lifeline.org', sub: 'Free, confidential support 24/7 across the US.' },
      'United Kingdom': { number: '116123', buttonText: 'Call 116 123', url: 'https://www.samaritans.org', sub: 'Free 24/7 listening support.' },
      'Canada': { number: '988', buttonText: 'Call or Text 988', url: 'https://988.ca', sub: 'Free, confidential support 24/7 nationwide.' },
      'India': { number: '14416', buttonText: 'Call 14416 (Tele-MANAS)', url: 'https://telemanas.mohfw.gov.in', sub: 'National Tele-Mental Health support in multiple Indian languages.' },
      'Australia': { number: '131114', buttonText: 'Call 13 11 14', url: 'https://www.lifeline.org.au', sub: 'Lifeline Australia, 24/7 crisis support.' },
      'Nigeria': { number: '08062106493', buttonText: 'Call 0806 210 6493', url: 'https://surpin.org', sub: 'Suicide Research and Prevention Initiative (SURPIN).' },
      'Kenya': { number: '1190', buttonText: 'Call 1190', url: 'https://helplinecenter.or.ke', sub: 'Kenya mental health & crisis helpline.' }
    };

    function populateCountrySelect() {
      // Clear anything that might already be there except first placeholder
      while (countrySelect.options.length > 1) {
        countrySelect.remove(1);
      }
      const sorted = allCountries.slice().sort((a, b) => a.localeCompare(b));
      sorted.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        countrySelect.appendChild(opt);
      });
    }

    function applyLocalization(country) {
      if (!country || !crisisBtnEl || !crisisTitleEl || !crisisDescEl || !crisisSubtextEl || !resourceLinksEl) {
        return;
      }
      const info = helplines[country];
      resourceLinksEl.innerHTML = '';

      if (info) {
        crisisTitleEl.textContent = 'Crisis Support (' + country + ')';
        crisisDescEl.textContent = 'If you are in crisis or having thoughts of suicide, help is available right now in ' + country + '.';
        crisisBtnEl.textContent = info.buttonText;
        crisisBtnEl.href = 'tel:' + info.number;
        crisisSubtextEl.textContent = info.sub;

        const localLink = document.createElement('a');
        localLink.href = info.url;
        localLink.target = '_blank';
        localLink.className = 'resource-link';
        localLink.textContent = country + ' mental health resources';
        resourceLinksEl.appendChild(localLink);
      } else {
        crisisTitleEl.textContent = 'Need Help Now?';
        crisisDescEl.textContent = 'We could not find a country‑specific helpline yet, but you can still reach global crisis services.';
        crisisBtnEl.textContent = 'Open Find A Helpline';
        crisisBtnEl.href = 'https://findahelpline.com';
        crisisSubtextEl.textContent = 'This site finds crisis lines by country and topic.';
      }

      const globalLink = document.createElement('a');
      globalLink.href = 'https://findahelpline.com';
      globalLink.target = '_blank';
      globalLink.className = 'resource-link';
      globalLink.textContent = 'Find A Helpline (Global Search)';
      resourceLinksEl.appendChild(globalLink);

      const befrienders = document.createElement('a');
      befrienders.href = 'https://www.befrienders.org';
      befrienders.target = '_blank';
      befrienders.className = 'resource-link';
      befrienders.textContent = 'Befrienders Worldwide';
      resourceLinksEl.appendChild(befrienders);
    }

    populateCountrySelect();

    // Load existing choice if present
    const savedCountry = localStorage.getItem('userCountry');
    if (savedCountry) {
      if (countrySelect.querySelector('option[value="' + savedCountry + '"]')) {
        countrySelect.value = savedCountry;
      }
      locationModal.style.display = 'none';
      applyLocalization(savedCountry);
    } else {
      // Show modal on first visit
      locationModal.style.display = 'flex';
      applyLocalization('India'); // Safe default until user chooses
    }

    if (confirmLocationBtn) {
      confirmLocationBtn.addEventListener('click', () => {
        const chosen = countrySelect.value;
        if (!chosen) {
          alert('Please select your country first.');
          return;
        }
        localStorage.setItem('userCountry', chosen);
        locationModal.style.display = 'none';
        applyLocalization(chosen);
      });
    }

    if (changeCountryBtn) {
      changeCountryBtn.addEventListener('click', () => {
        localStorage.removeItem('userCountry');
        countrySelect.value = '';
        locationModal.style.display = 'flex';
      });
    }

    // Expose a small helper so you can change country later from console if needed
    window.reignitiaSetCountry = function(countryName) {
      if (!countryName) return;
      localStorage.setItem('userCountry', countryName);
      if (countrySelect.querySelector('option[value="' + countryName + '"]')) {
        countrySelect.value = countryName;
      }
      applyLocalization(countryName);
    };
  }

  // 5. Mood tracker + interactive chart
  let moodChartInstance = null;
  const moodChartCanvas = document.getElementById('mood-chart');
  const moodButtons = document.querySelectorAll('.mood-btn');
  const moodNotesEl = document.getElementById('mood-notes');
  const saveMoodBtn = document.getElementById('save-mood');

  const moodScoreMap = {
    great: 5,
    good: 4,
    okay: 3,
    low: 2,
    struggling: 1,
    happy: 5,
    calm: 4,
    neutral: 3,
    sad: 2,
    awful: 1
  };

  function getStoredMoodData() {
    try {
      return JSON.parse(localStorage.getItem('moodData') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveMoodData(arr) {
    localStorage.setItem('moodData', JSON.stringify(arr));
  }

  function rebuildMoodChart() {
    if (!moodChartCanvas || typeof Chart === 'undefined') return;
    const ctx = moodChartCanvas.getContext('2d');
    if (!ctx) return;

    const data = getStoredMoodData();
    const lastEntries = data.slice(-14); // last 2 weeks
    const labels = lastEntries.map(entry => entry.label);
    const values = lastEntries.map(entry => entry.moodScore);

    const chartData = {
      labels: labels.length ? labels : ['No data yet'],
      datasets: [{
        label: 'Mood score (1‑5)',
        data: values.length ? values : [0],
        tension: 0.4,
        fill: true,
        borderColor: '#9b6bcc',
        backgroundColor: 'rgba(155,107,204,0.18)',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#e8f1f5'
          }
        },
        tooltip: {
          callbacks: {
            afterBody: function(items) {
              const idx = items[0].dataIndex;
              const entry = lastEntries[idx];
              return entry && entry.note ? '\nNote: ' + entry.note : '';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 5.5,
          ticks: { color: '#a7b8c4', stepSize: 1 },
          grid: { color: 'rgba(50,184,198,0.2)' }
        },
        x: {
          ticks: { color: '#a7b8c4' },
          grid: { color: 'rgba(19,34,56,0.4)' }
        }
      }
    };

    if (!moodChartInstance) {
      moodChartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
      });
    } else {
      moodChartInstance.data = chartData;
      moodChartInstance.options = chartOptions;
      moodChartInstance.update();
    }
  }

  let selectedMoodScore = null;
  if (moodButtons.length) {
    moodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        moodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const explicitScore = btn.dataset.score ? Number(btn.dataset.score) : null;
        if (explicitScore) {
          selectedMoodScore = explicitScore;
        } else {
          const moodName = (btn.dataset.mood || '').toLowerCase();
          selectedMoodScore = moodScoreMap[moodName] || null;
        }
      });
    });
  }

  if (saveMoodBtn) {
    saveMoodBtn.addEventListener('click', () => {
      if (!selectedMoodScore) {
        alert('Please select a mood before saving.');
        return;
      }
      const note = moodNotesEl ? moodNotesEl.value.trim() : '';
      const now = new Date();
      const label = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const existing = getStoredMoodData();
      existing.push({
        timestamp: now.toISOString(),
        label,
        moodScore: selectedMoodScore,
        note
      });
      saveMoodData(existing);

      if (moodNotesEl) moodNotesEl.value = '';
      moodButtons.forEach(b => b.classList.remove('active'));
      selectedMoodScore = null;

      rebuildMoodChart();
      alert('Mood check‑in saved locally on this device.');
    });
  }

  rebuildMoodChart();

  // 6. Gratitude journal (multi‑prompt + save)
  const gratitudePromptEl = document.getElementById('gratitude-prompt');
  const newPromptBtn = document.getElementById('new-prompt');
  const g1 = document.getElementById('gratitude-1');
  const g2 = document.getElementById('gratitude-2');
  const g3 = document.getElementById('gratitude-3');
  const saveGratitudeBtn = document.getElementById('save-gratitude');

  const gratitudePrompts = [
    'What made you smile today?',
    'Who are three people you are grateful for right now?',
    'Name one thing about your body or health that you appreciate.',
    'What is something in nature that you are grateful for?',
    'What is a small win from today that you are proud of?',
    'Which memory always makes you feel warm inside?',
    'What part of your day felt safest or calmest?'
  ];

  function pickRandomPrompt() {
    if (!gratitudePromptEl) return;
    const random = gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)];
    gratitudePromptEl.textContent = '"' + random + '"';
  }

  if (newPromptBtn) {
    newPromptBtn.addEventListener('click', pickRandomPrompt);
  }

  function loadLastGratitude() {
    try {
      const stored = JSON.parse(localStorage.getItem('gratitudeLast') || 'null');
      if (!stored || !stored.entries) return;
      const [e1, e2, e3] = stored.entries;
      if (g1) g1.value = e1 || '';
      if (g2) g2.value = e2 || '';
      if (g3) g3.value = e3 || '';
    } catch (e) {
      // ignore
    }
  }

  if (saveGratitudeBtn) {
    saveGratitudeBtn.addEventListener('click', () => {
      const e1 = g1 ? g1.value.trim() : '';
      const e2 = g2 ? g2.value.trim() : '';
      const e3 = g3 ? g3.value.trim() : '';
      if (!e1 && !e2 && !e3) {
        alert('Write at least one gratitude item before saving.');
        return;
      }
      const payload = {
        timestamp: new Date().toISOString(),
        entries: [e1, e2, e3]
      };
      localStorage.setItem('gratitudeLast', JSON.stringify(payload));
      alert('Gratitude entry saved on this device.');

      if (g1) g1.value = '';
      if (g2) g2.value = '';
      if (g3) g3.value = '';
    });
  }
  loadLastGratitude();

  // 7. CBT thought diary (simple local log)
  const cbtSituationEl = document.getElementById('cbt-situation');
  const cbtThoughtEl = document.getElementById('cbt-thought');
  const cbtBalanceEl = document.getElementById('cbt-balance');
  const saveCbtBtn = document.getElementById('save-cbt');

  function saveCbtEntry() {
    if (!cbtSituationEl || !cbtThoughtEl || !cbtBalanceEl) return;
    const situation = cbtSituationEl.value.trim();
    const thought = cbtThoughtEl.value.trim();
    const balance = cbtBalanceEl.value.trim();
    if (!situation || !thought) {
      alert('Please fill in at least the situation and automatic thought.');
      return;
    }
    let log;
    try {
      log = JSON.parse(localStorage.getItem('cbtLog') || '[]');
      if (!Array.isArray(log)) log = [];
    } catch (e) {
      log = [];
    }
    log.push({
      timestamp: new Date().toISOString(),
      situation,
      thought,
      balance
    });
    localStorage.setItem('cbtLog', JSON.stringify(log));
    cbtSituationEl.value = '';
    cbtThoughtEl.value = '';
    cbtBalanceEl.value = '';
    alert('Thought diary entry saved locally.');
  }

  if (saveCbtBtn) {
    saveCbtBtn.addEventListener('click', saveCbtEntry);
  }

  // 8. Worry‑time reminder (simple in‑tab reminder)
  const worryTimeInput = document.getElementById('worry-time');
  const setWorryBtn = document.getElementById('set-worry-reminder');
  let worryCheckInterval = null;

  function startWorryWatcher() {
    if (worryCheckInterval) {
      clearInterval(worryCheckInterval);
      worryCheckInterval = null;
    }
    const storedTime = localStorage.getItem('worryTime');
    if (!storedTime) return;

    worryCheckInterval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const current = hh + ':' + mm;
      const todayKey = now.toISOString().slice(0, 10);
      const lastAlertDay = localStorage.getItem('worryAlertDay');

      if (current === storedTime && lastAlertDay !== todayKey) {
        alert('This is your scheduled "worry time". If worries pop up earlier in the day, try to park them until this window.');
        localStorage.setItem('worryAlertDay', todayKey);
      }
    }, 30 * 1000); // check every 30 seconds while tab is open
  }

  if (setWorryBtn && worryTimeInput) {
    setWorryBtn.addEventListener('click', () => {
      const value = worryTimeInput.value;
      if (!value) {
        alert('Choose a time first.');
        return;
      }
      localStorage.setItem('worryTime', value);
      alert('Daily worry‑time reminder saved for ' + value + ' (works while this page is open).');
      startWorryWatcher();
    });

    // Restore previously chosen time
    const savedTime = localStorage.getItem('worryTime');
    if (savedTime) {
      worryTimeInput.value = savedTime;
      startWorryWatcher();
    }
  }

  // 9. Sleep calculator
  const wakeTimeInput = document.getElementById('wake-time');
  const calcSleepBtn = document.getElementById('calc-sleep');
  const sleepResultsEl = document.getElementById('sleep-results');

  function computeBedtimes(wakeTime) {
    const [h, m] = wakeTime.split(':').map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(h, m, 0, 0);

    const cycles = [6, 7.5, 9]; // hours of sleep
    return cycles.map(hours => {
      const bed = new Date(wakeDate.getTime() - hours * 60 * 60 * 1000);
      const hh = String(bed.getHours()).padStart(2, '0');
      const mm = String(bed.getMinutes()).padStart(2, '0');
      return hh + ':' + mm;
    });
  }

  if (calcSleepBtn && wakeTimeInput && sleepResultsEl) {
    calcSleepBtn.addEventListener('click', () => {
      const value = wakeTimeInput.value;
      if (!value) {
        alert('Please choose the time you need to wake up.');
        return;
      }
      const options = computeBedtimes(value);
      sleepResultsEl.innerHTML =
        '<p style="margin-bottom:8px;">To wake up around <strong>' + value + '</strong>, try falling asleep at one of these times (including ~15 minutes to fall asleep):</p>' +
        '<p style="font-family: Space Mono, monospace; font-size: 1.1rem;">' +
        options.join('  ·  ') +
        '</p>';
    });
  }

  // 10. Daily routine builder (add / remove / persist)
  const routineListEl = document.getElementById('routine-list');
  const newRoutineInput = document.getElementById('new-routine-item');
  const addRoutineBtn = document.getElementById('add-routine-item');
  const saveRoutineBtn = document.getElementById('save-routine');

  const defaultRoutine = [
    { text: 'Dim lights 60 minutes before bed', checked: false },
    { text: 'No screens 30 minutes before bed', checked: false },
    { text: 'Brush teeth and wash face', checked: false },
    { text: 'Read or journal for 10–15 minutes', checked: false }
  ];

  function getRoutineData() {
    try {
      const parsed = JSON.parse(localStorage.getItem('routineData') || 'null');
      if (Array.isArray(parsed) && parsed.length) return parsed;
      return defaultRoutine.slice();
    } catch (e) {
      return defaultRoutine.slice();
    }
  }

  function saveRoutineData(data) {
    localStorage.setItem('routineData', JSON.stringify(data));
  }

  function renderRoutineList() {
    if (!routineListEl) return;
    const data = getRoutineData();
    routineListEl.innerHTML = '';

    data.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'routine-item';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '10px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!item.checked;
      checkbox.style.width = '18px';
      checkbox.style.height = '18px';

      const label = document.createElement('span');
      label.textContent = item.text;
      label.style.color = item.checked ? 'var(--text-dim)' : 'var(--text)';
      label.style.textDecoration = item.checked ? 'line-through' : 'none';

      checkbox.addEventListener('change', () => {
        const current = getRoutineData();
        if (current[index]) {
          current[index].checked = checkbox.checked;
          saveRoutineData(current);
          renderRoutineList();
        }
      });

      left.appendChild(checkbox);
      left.appendChild(label);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.addEventListener('click', () => {
        const current = getRoutineData();
        current.splice(index, 1);
        saveRoutineData(current);
        renderRoutineList();
      });

      row.appendChild(left);
      row.appendChild(deleteBtn);
      routineListEl.appendChild(row);
    });
  }

  if (addRoutineBtn && newRoutineInput && routineListEl) {
    addRoutineBtn.addEventListener('click', () => {
      const text = newRoutineInput.value.trim();
      if (!text) {
        alert('Type a routine item first.');
        return;
      }
      const current = getRoutineData();
      current.push({ text, checked: false });
      saveRoutineData(current);
      newRoutineInput.value = '';
      renderRoutineList();
    });
  }

  if (saveRoutineBtn) {
    saveRoutineBtn.addEventListener('click', () => {
      alert('Your current routine and checked items are saved on this device.');
    });
  }

  renderRoutineList();

  // 11. Generic autosave helper for any extra textareas (hierarchy, self‑passion, etc.)
  function setupAutosaveTextarea(id, storageKey) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) el.value = saved;
    } catch (e) {
      // ignore
    }
    el.addEventListener('input', () => {
      localStorage.setItem(storageKey, el.value);
    });
  }

  // If you name your textareas with these IDs, they will auto‑save:
  setupAutosaveTextarea('hierarchy-notes', 'hierarchyNotes');
  setupAutosaveTextarea('self-passion-notes', 'selfPassionNotes');
  setupAutosaveTextarea('values-notes', 'valuesNotes');
  setupAutosaveTextarea('thought-diary-extra', 'thoughtDiaryExtra');

})();
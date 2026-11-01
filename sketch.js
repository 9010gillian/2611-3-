// 宣告全域變數
let masterQuestionBank = []; // 50 題完整題庫
let shuffledQuestions = []; // 從題庫隨機抽取的 10 題
let currentQuestionIndex = 0; // 目前進行到的題目編號 (從 0 開始)
let score = 0; // 記錄答對的題數
let state = 'START'; // 當前遊戲狀態：'START' (初始頁面)、'QUESTION' (答題中)、'WAIT_CORRECT' (答錯等待中)、'SHOW_ANSWER' (顯示正解/可進下一題)、'END' (測驗結束)
let selectedOption = -1; // 玩家點擊的選項索引 (-1 表示未選擇)
let isCorrect = false; // 紀錄目前這題是否答對
let animOffset = 0; // 用於計算上下或左右移動的偏移量
let wrongAnswerTimer = 0; // 記錄答錯後的計時器（用於延遲 1.5 秒）

// 動態視覺元素變數
let clouds = []; // 雲朵物件陣列
let confettiList = []; // 答對彩帶陣列

// 四個選項雲朵在畫面中四處移動的位置與速度物件陣列 (防重疊)
let optionClouds = [];

// 按鈕位置尺寸設定
let nextBtn = { x: 0, y: 0, w: 160, h: 50 };
let startBtn = { x: 0, y: 0, w: 200, h: 60 };
let restartBtn = { x: 0, y: 0, w: 180, h: 50 };

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 文字對齊設定為水平居中與垂直居中
  textAlign(CENTER, CENTER);

  // 動態載入 Google Fonts Tiny5 字型樣式表
  let link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Tiny5&display=swap';
  document.head.appendChild(link);

  // 初始化 6 朵實心白雲（初始頁面背景用）
  for (let i = 0; i < 6; i++) {
    let cloudY = (i % 2 === 0) ? random(height * 0.05, height * 0.2) : random(height * 0.72, height * 0.88);
    clouds.push({
      x: random(width),
      y: cloudY,
      speed: random(0.6, 1.4),
      scale: random(0.7, 1.2)
    });
  }

  // 初始化 50 題國中英文「時態測驗」題庫
  init50QuestionBank();
}

function draw() {
  // 根據當前狀態繪製對應畫面
  if (state === 'START') {
    background(135, 206, 235);
    drawStartScreen();
  } else if (state === 'QUESTION' || state === 'WAIT_CORRECT' || state === 'SHOW_ANSWER') {
    // 檢查是否處於答錯等待中（1.5秒計時），時間到則自動切換為顯示正確答案狀態
    if (state === 'WAIT_CORRECT' && millis() - wrongAnswerTimer > 1500) {
      state = 'SHOW_ANSWER';
    }
    background('#a9def9'); // 畫布背景顏色 #a9def9
    drawQuiz();
    
    // 答對時繪製並更新掉落的彩帶動畫
    if (state === 'SHOW_ANSWER' && isCorrect) {
      updateAndDrawConfetti();
    }
  } else if (state === 'END') {
    background('#a9def9');
    drawEndScreen();
  }
}

// 繪製藍天白雲動態初始頁面
function drawStartScreen() {
  noStroke();
  fill(255); 
  for (let c of clouds) {
    push();
    translate(c.x, c.y);
    scale(c.scale);
    drawCloudShape(0, 0, 1.2);
    pop();

    c.x += c.speed;
    if (c.x - 100 > width) {
      c.x = -100;
      c.y = (random() > 0.5) ? random(height * 0.05, height * 0.2) : random(height * 0.72, height * 0.88);
    }
  }

  textFont('Tiny5, monospace');
  textStyle(BOLD);
  fill(255);
  textSize(height * 0.075);
  text("國中簡易英文測驗", width / 2, height * 0.4);

  startBtn.x = width / 2 - startBtn.w / 2;
  startBtn.y = height * 0.62;

  stroke(255);
  strokeWeight(3);
  fill(70, 130, 180);
  rect(startBtn.x, startBtn.y, startBtn.w, startBtn.h, 15);

  textFont('Tiny5, monospace');
  textStyle(NORMAL);
  noStroke();
  fill(255);
  textSize(26);
  text("開始測驗", width / 2, startBtn.y + startBtn.h / 2);
}

// 繪製自定義雲朵形狀的輔助函式（純白色 #ffffff）
function drawCloudShape(ox, oy, s) {
  push();
  translate(ox, oy);
  scale(s);
  ellipse(0, 0, 90, 55);
  ellipse(-30, 12, 60, 45);
  ellipse(30, 12, 60, 45);
  ellipse(15, -12, 50, 50);
  ellipse(-15, -12, 50, 50);
  pop();
}

// 初始化新一輪的選項雲朵位置與速度（確保初始不重疊）
function initOptionClouds() {
  optionClouds = [];
  let radius = 70; // 雲朵碰撞半徑

  for (let i = 0; i < 4; i++) {
    let cx, cy, overlapping;
    let attempts = 0;
    
    do {
      overlapping = false;
      cx = random(150, width - 150);
      cy = random(height * 0.38, height * 0.78);

      // 檢查是否與已產生的雲朵重疊
      for (let oc of optionClouds) {
        let d = dist(cx, cy, oc.x, oc.y);
        if (d < radius * 2.2) {
          overlapping = true;
          break;
        }
      }
      attempts++;
    } while (overlapping && attempts < 100);

    optionClouds.push({
      x: cx,
      y: cy,
      vx: random(-1.2, 1.2) || 1, 
      vy: random(-0.8, 0.8) || 0.6, 
      r: radius
    });
  }
}

// 繪製測驗主要介面 (題目純文字 + 互不重疊的漂移雲朵選項)
function drawQuiz() {
  let qData = shuffledQuestions[currentQuestionIndex];

  // 1. 題目呈現純文字狀態但不移動（置於畫面上方）
  textFont('Tiny5, monospace');
  textStyle(BOLD);
  fill(40);
  textSize(height * 0.045);
  text(`Q${currentQuestionIndex + 1}. ${qData.q}`, width / 2, height * 0.22);

  // 2. 只有在 'QUESTION'（答題中）狀態下，選項雲朵才會四處移動並進行碰撞防重疊檢測
  if (state === 'QUESTION') {
    for (let oc of optionClouds) {
      oc.x += oc.vx;
      oc.y += oc.vy;

      // 邊界反彈
      let marginW = 120;
      if (oc.x < marginW || oc.x > width - marginW) oc.vx *= -1;
      let minY = height * 0.35;
      let maxY = height * 0.82;
      if (oc.y < minY || oc.y > maxY) oc.vy *= -1;
    }

    // 選項雲朵之間互相碰撞推開（絕對不重疊）
    for (let i = 0; i < optionClouds.length; i++) {
      for (let j = i + 1; j < optionClouds.length; j++) {
        let c1 = optionClouds[i];
        let c2 = optionClouds[j];
        let dx = c2.x - c1.x;
        let dy = c2.y - c1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let minDist = c1.r * 2.1; // 保持安全間距

        if (distance < minDist && distance > 0) {
          let nx = dx / distance;
          let ny = dy / distance;
          let overlap = minDist - distance;

          // 互相推開
          c1.x -= nx * (overlap / 2);
          c1.y -= ny * (overlap / 2);
          c2.x += nx * (overlap / 2);
          c2.y += ny * (overlap / 2);

          // 速度反彈
          let kx = c1.vx - c2.vx;
          let ky = c1.vy - c2.vy;
          let p = 2 * (nx * kx + ny * ky) / 2;
          c1.vx -= p * nx;
          c1.vy -= p * ny;
          c2.vx += p * nx;
          c2.vy += p * ny;
        }
      }
    }
  }

  // 動態效果計算 (上下或左右移動)
  if (state === 'WAIT_CORRECT') {
    animOffset = sin(frameCount * 0.5) * 12;
  } else if (state === 'SHOW_ANSWER') {
    animOffset = sin(frameCount * 0.2) * 12;
  } else {
    animOffset = 0;
  }

  // 3. 繪製四個選項雲朵
  textFont('sans-serif');
  textStyle(NORMAL);

  for (let i = 0; i < 4; i++) {
    let oc = optionClouds[i];
    let cloudColor = color(255, 255, 255); // 雲朵固定顏色 #ffffff
    let drawX = oc.x;
    let drawY = oc.y;

    if (state === 'WAIT_CORRECT') {
      if (i === selectedOption) {
        cloudColor = color('#dd2d4a'); // 答錯：紅色，左右移動
        drawX += animOffset;
      }
    } else if (state === 'SHOW_ANSWER') {
      let correctAns = qData.answer;

      if (isCorrect) {
        if (i === correctAns) {
          cloudColor = color('#a7c957'); // 答對：綠色，上下跳動
          drawY += animOffset;
        }
      } else {
        if (i === correctAns) {
          cloudColor = color('#3a86ff'); // 答錯1.5秒後正解：藍色，上下跳動
          drawY += animOffset;
        }
      }
    }

    // 繪製選項雲朵外觀 (#ffffff 或狀態色)
    noStroke();
    fill(cloudColor);
    drawCloudShape(drawX, drawY, 1.4);

    // 繪製選項文字
    fill(30);
    textSize(height * 0.025);
    text(qData.options[i], drawX, drawY);
  }

  // 4. 停止移動後，若處於顯示答案狀態，於下方顯示「下一題」按鈕
  if (state === 'SHOW_ANSWER') {
    nextBtn.x = width / 2 - nextBtn.w / 2;
    nextBtn.y = height * 0.86;

    stroke(100);
    strokeWeight(2);
    fill(70, 130, 180);
    rect(nextBtn.x, nextBtn.y, nextBtn.w, nextBtn.h, 8);

    textFont('Tiny5, monospace');
    noStroke();
    fill(255);
    textSize(22);
    let btnText = (currentQuestionIndex < shuffledQuestions.length - 1) ? "下一題" : "觀看結果";
    text(btnText, width / 2, nextBtn.y + nextBtn.h / 2);
  }
}

// 產生答對彩帶顆粒
function createConfetti() {
  confettiList = [];
  let colors = ['#f72585', '#7209b7', '#3f37c9', '#4cc9f0', '#4895ef', '#e63946', '#ffb703'];
  for (let i = 0; i < 70; i++) {
    confettiList.push({
      x: random(width),
      y: random(-height * 0.5, 0),
      w: random(8, 15),
      h: random(8, 15),
      color: random(colors),
      vy: random(3, 7),
      vx: random(-2, 2),
      rot: random(TWO_PI),
      vRot: random(-0.1, 0.1)
    });
  }
}

// 更新與繪製由上而下掉落的彩帶
function updateAndDrawConfetti() {
  noStroke();
  for (let c of confettiList) {
    push();
    translate(c.x, c.y);
    rotate(c.rot);
    fill(c.color);
    rect(0, 0, c.w, c.h);
    pop();

    c.y += c.vy;
    c.x += c.vx;
    c.rot += c.vRot;
  }
}

// 繪製十題作答完畢後的結算畫面（僅純黑與純藍色字體）
function drawEndScreen() {
  textFont('Tiny5, monospace');
  textStyle(BOLD);
  fill(0); // 純黑
  textSize(height * 0.055);
  text("測驗結束！", width / 2, height * 0.28);

  textFont('sans-serif');
  textStyle(NORMAL);
  textSize(height * 0.035);
  fill(58, 134, 255); // 純藍色 (#3a86ff)
  text(`您的得分：${score} / ${shuffledQuestions.length} 題`, width / 2, height * 0.40);

  let encouragingText = "";
  if (score === 10) {
    encouragingText = "太強了！完美全對！時態高手非你莫屬！";
  } else if (score >= 7) {
    encouragingText = "表現超讚！英文時態概念非常紮實！";
  } else if (score >= 4) {
    encouragingText = "做得好！已經掌握大部分時態囉，再接再厲！";
  } else {
    encouragingText = "沒關係，多練習幾次時態就會更上手喔！";
  }

  fill(0); // 純黑
  textSize(height * 0.028);
  text(encouragingText, width / 2, height * 0.50);

  restartBtn.x = width / 2 - restartBtn.w / 2;
  restartBtn.y = height * 0.62;

  stroke(0);
  strokeWeight(2);
  fill(100, 180, 100);
  rect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, 8);

  noStroke();
  fill(0); // 純黑
  textSize(20);
  text("再測驗一次", width / 2, restartBtn.y + restartBtn.h / 2);
}

// 監聽滑鼠點擊事件
function mousePressed() {
  // 狀態一：在初始頁面點擊「開始測驗」
  if (state === 'START') {
    if (mouseX >= startBtn.x && mouseX <= startBtn.x + startBtn.w &&
        mouseY >= startBtn.y && mouseY <= startBtn.y + startBtn.h) {
      startNewQuizRound();
    }
  }
  // 狀態二：在答題狀態下點擊移動中的選項雲朵
  else if (state === 'QUESTION') {
    for (let i = 0; i < 4; i++) {
      let oc = optionClouds[i];
      let hitRadius = 70; 
      let d = dist(mouseX, mouseY, oc.x, oc.y);

      if (d < hitRadius) {
        selectedOption = i;
        let correctAns = shuffledQuestions[currentQuestionIndex].answer;

        if (selectedOption === correctAns) {
          isCorrect = true;
          score++; 
          createConfetti(); 
          state = 'SHOW_ANSWER'; 
        } else {
          isCorrect = false; 
          wrongAnswerTimer = millis(); 
          state = 'WAIT_CORRECT'; 
        }
        break;
      }
    }
  } 
  // 狀態三：在已顯示正確答案狀態下點擊「下一題」按鈕
  else if (state === 'SHOW_ANSWER') {
    if (mouseX >= nextBtn.x && mouseX <= nextBtn.x + nextBtn.w &&
        mouseY >= nextBtn.y && mouseY <= nextBtn.y + nextBtn.h) {
      
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        currentQuestionIndex++;
        state = 'QUESTION'; 
        selectedOption = -1;
        initOptionClouds(); // 進入下一題時重新隨機生成防重疊雲朵位置
      } else {
        state = 'END'; 
      }
    }
  } 
  // 狀態四：在結束畫面點擊「再測驗一次」
  else if (state === 'END') {
    if (mouseX >= restartBtn.x && mouseX <= restartBtn.x + restartBtn.w &&
        mouseY >= restartBtn.y && mouseY <= restartBtn.y + restartBtn.h) {
      startNewQuizRound();
    }
  }
}

// 從 50 題題庫中隨機抽取 10 題，選項固定按 A, B, C, D 順序排列
function startNewQuizRound() {
  let random10 = shuffle([...masterQuestionBank]).slice(0, 10);

  shuffledQuestions = random10.map(item => {
    return {
      q: item.q,
      options: item.options, 
      answer: item.answer     
    };
  });

  currentQuestionIndex = 0;
  score = 0;
  selectedOption = -1;
  initOptionClouds(); // 初始化本題選項雲朵位置與速度
  state = 'QUESTION';
}

// 視窗尺寸改變時自動調整畫布大小 (維持全螢幕)
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 初始化 50 題國中英文「時態測驗」完整題庫
function init50QuestionBank() {
  masterQuestionBank = [
    { q: "What is the past tense of 'go'?", options: ["A. goed", "B. went", "C. gone", "D. going"], answer: 1 },
    { q: "She _____ to school every day.", options: ["A. walk", "B. walking", "C. walked", "D. walks"], answer: 3 },
    { q: "They _____ playing basketball right now.", options: ["A. is", "B. am", "C. are", "D. be"], answer: 2 },
    { q: "Look at the sky! It is going to _____.", options: ["A. rain", "B. rainy", "C. raining", "D. rained"], answer: 0 },
    { q: "I _____ my homework before mom came home.", options: ["A. finish", "B. finished", "C. finishing", "D. finishes"], answer: 1 },
    { q: "He _____ English for three years.", options: ["A. study", "B. studied", "C. has studied", "D. studying"], answer: 2 },
    { q: "What _____ you doing at 8 PM yesterday?", options: ["A. are", "B. were", "C. did", "D. was"], answer: 1 },
    { q: "Water _____ at 100 degrees Celsius.", options: ["A. boil", "B. boils", "C. boiled", "D. boiling"], answer: 1 },
    { q: "She _____ to Japan next month.", options: ["A. will go", "B. goes", "C. went", "D. going"], answer: 0 },
    { q: "They _____ dinner when the phone rang.", options: ["A. eat", "B. are eating", "C. were eating", "D. ate"], answer: 2 },
    { q: "Listen! Somebody _____ at the door.", options: ["A. knocks", "B. is knocking", "C. knocked", "D. knock"], answer: 1 },
    { q: "My father _____ tennis every weekend.", options: ["A. play", "B. playing", "C. plays", "D. played"], answer: 2 },
    { q: "We _____ a movie two days ago.", options: ["A. watch", "B. watched", "C. watching", "D. watches"], answer: 1 },
    { q: "Tom _____ already left when I arrived.", options: ["A. has", "B. have", "C. had", "D. having"], answer: 2 },
    { q: "If it _____ tomorrow, we will stay at home.", options: ["A. rains", "B. will rain", "C. rained", "D. rain"], answer: 0 },
    { q: "What time _____ you usually wake up?", options: ["A. do", "B. does", "C. did", "D. are"], answer: 0 },
    { q: "She _____ a new bike last Sunday.", options: ["A. buy", "B. bought", "C. buys", "D. buying"], answer: 1 },
    { q: "They _____ in Taipei since 2015.", options: ["A. lived", "B. live", "C. have lived", "D. living"], answer: 2 },
    { q: "While I _____ reading, my brother was sleeping.", options: ["A. am", "B. was", "C. were", "D. be"], answer: 1 },
    { q: "He promise he _____ help us tomorrow.", options: ["A. will", "B. would", "C. did", "D. does"], answer: 0 },
    { q: "The sun _____ in the east.", options: ["A. rise", "B. rises", "C. rising", "D. rose"], answer: 1 },
    { q: "I _____ never seen such a beautiful bird before.", options: ["A. has", "B. am", "C. have", "D. had"], answer: 2 },
    { q: "Where _____ you go for vacation last year?", options: ["A. do", "B. did", "C. done", "D. does"], answer: 1 },
    { q: "She _____ a letter right now.", options: ["A. writes", "B. is writing", "C. wrote", "D. written"], answer: 1 },
    { q: "We _____ visit our grandparents next Saturday.", options: ["A. will", "B. visited", "C. visit", "D. visits"], answer: 0 },
    { q: "He _____ his keys yesterday afternoon.", options: ["A. loses", "B. lost", "C. losing", "D. lose"], answer: 1 },
    { q: "Look! The cat _____ up the tree.", options: ["A. climbs", "B. is climbing", "C. climbed", "D. climb"], answer: 1 },
    { q: "They _____ English when the teacher entered.", options: ["A. speak", "B. were speaking", "C. spoke", "D. spoken"], answer: 1 },
    { q: "My sister _____ not like vegetables.", options: ["A. do", "B. does", "C. is", "D. did"], answer: 1 },
    { q: "How long _____ you known each other?", options: ["A. do", "B. are", "C. have", "D. did"], answer: 2 },
    { q: "Yesterday I _____ to the market to buy apples.", options: ["A. go", "B. went", "C. going", "D. goes"], answer: 1 },
    { q: "Be quiet! The baby _____.", options: ["A. sleeps", "B. is sleeping", "C. slept", "D. sleep"], answer: 1 },
    { q: "I think it _____ be sunny tomorrow.", options: ["A. will", "B. is", "C. was", "D. did"], answer: 0 },
    { q: "She _____ breakfast at 7 AM every morning.", options: ["A. eat", "B. eats", "C. ate", "D. eating"], answer: 1 },
    { q: "We _____ for the bus for 30 minutes already.", options: ["A. wait", "B. waited", "C. have waited", "D. waiting"], answer: 2 },
    { q: "When I was young, I _____ to play piano.", options: ["A. like", "B. liked", "C. liking", "D. likes"], answer: 1 },
    { q: "What _____ you doing when I called you?", options: ["A. are", "B. were", "C. do", "D. did"], answer: 1 },
    { q: "David _____ a song on the stage right now.", options: ["A. sings", "B. is singing", "C. sang", "D. sung"], answer: 1 },
    { q: "She _____ her room every Saturday.", options: ["A. clean", "B. cleans", "C. cleaned", "D. cleaning"], answer: 1 },
    { q: "They _____ to Paris two years ago.", options: ["A. travel", "B. traveled", "C. traveling", "D. travels"], answer: 1 },
    { q: "I _____ already done my homework.", options: ["A. have", "B. has", "C. am", "D. do"], answer: 0 },
    { q: "The train _____ at 9:00 PM tonight.", options: ["A. leave", "B. leaves", "C. left", "D. leaving"], answer: 1 },
    { q: "He _____ a doctor in the future.", options: ["A. becomes", "B. became", "C. will become", "D. becoming"], answer: 2 },
    { q: "While mom was cooking, dad _____ the car.", options: ["A. washes", "B. was washing", "C. washed", "D. wash"], answer: 1 },
    { q: "Birds _____ in the sky.", options: ["A. fly", "B. flies", "C. flying", "D. flew"], answer: 0 },
    { q: "Last night, I _____ a terrible nightmare.", options: ["A. have", "B. had", "C. having", "D. has"], answer: 1 },
    { q: "She _____ TV when her friend arrived.", options: ["A. watches", "B. was watching", "C. watched", "D. watching"], answer: 1 },
    { q: "We _____ to the beach if it is hot tomorrow.", options: ["A. go", "B. went", "C. will go", "D. gone"], answer: 2 },
    { q: "Jack _____ not finish his lunch yet.", options: ["A. has", "B. is", "C. did", "D. does"], answer: 0 },
    { q: "Look! The dog _____ after a butterfly.", options: ["A. runs", "B. is running", "C. ran", "D. run"], answer: 1 }
  ];
}
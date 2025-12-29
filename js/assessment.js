// 睡眠评估页面逻辑

let currentQuestion = 1;
const totalQuestions = 12;
const answers = {};

// 获取DOM元素
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressBar = document.getElementById('progressBar');
const currentQuestionText = document.getElementById('currentQuestion');
const questionCards = document.querySelectorAll('.question-card');

// 更新进度条
function updateProgress() {
    const progress = (currentQuestion / totalQuestions) * 100;
    progressBar.style.width = progress + '%';
    currentQuestionText.textContent = currentQuestion;
}

// 显示当前问题
function showQuestion(questionNumber) {
    questionCards.forEach(card => {
        card.classList.remove('active');
    });

    const currentCard = document.querySelector(`[data-question="${questionNumber}"]`);
    if (currentCard) {
        currentCard.classList.add('active');
    }

    // 更新按钮显示
    if (questionNumber === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }

    if (questionNumber === totalQuestions) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }

    updateProgress();
}

// 检查当前问题是否已回答
function isCurrentQuestionAnswered() {
    const currentCard = document.querySelector(`[data-question="${currentQuestion}"]`);

    // Q10 是多选题
    if (currentQuestion === 10) {
        const checkedBoxes = currentCard.querySelectorAll('input[type="checkbox"]:checked');
        return checkedBoxes.length > 0;
    }

    // 其他题目是单选
    const selectedOption = currentCard.querySelector('input[type="radio"]:checked');
    return selectedOption !== null;
}

// 保存答案
function saveAnswer(questionNumber) {
    const currentCard = document.querySelector(`[data-question="${questionNumber}"]`);

    // Q10 是多选题，特殊处理
    if (questionNumber === 10) {
        const checkedBoxes = currentCard.querySelectorAll('input[type="checkbox"]:checked');
        const values = Array.from(checkedBoxes).map(cb => cb.value);

        // 计算多选题的分数
        // "基本没有" = 1分，其他每选一项 +1分
        if (values.includes('none')) {
            answers[`q${questionNumber}`] = 1;
        } else {
            answers[`q${questionNumber}`] = Math.min(values.length + 1, 4); // 最高4分
        }

        // 同时保存选择的具体内容
        answers[`q${questionNumber}_values`] = values;
    } else {
        // 其他题目是单选
        const selectedOption = currentCard.querySelector('input[type="radio"]:checked');
        if (selectedOption) {
            answers[`q${questionNumber}`] = parseInt(selectedOption.value);
        }
    }
}

// Q10多选框的互斥逻辑：选择"基本没有"时，取消其他选项
document.addEventListener('DOMContentLoaded', () => {
    const q10Card = document.querySelector('[data-question="10"]');
    if (q10Card) {
        const noneCheckbox = q10Card.querySelector('input[value="none"]');
        const otherCheckboxes = q10Card.querySelectorAll('input[type="checkbox"]:not([value="none"])');

        // 点击"基本没有"时，取消其他选项
        if (noneCheckbox) {
            noneCheckbox.addEventListener('change', () => {
                if (noneCheckbox.checked) {
                    otherCheckboxes.forEach(cb => cb.checked = false);
                }
            });
        }

        // 点击其他选项时，取消"基本没有"
        otherCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked && noneCheckbox) {
                    noneCheckbox.checked = false;
                }
            });
        });
    }
});

// 下一题
nextBtn.addEventListener('click', () => {
    if (!isCurrentQuestionAnswered()) {
        if (currentQuestion === 10) {
            alert('请至少选择一个选项');
        } else {
            alert('请选择一个选项');
        }
        return;
    }

    saveAnswer(currentQuestion);

    if (currentQuestion < totalQuestions) {
        currentQuestion++;
        showQuestion(currentQuestion);
    }
});

// 上一题
prevBtn.addEventListener('click', () => {
    if (currentQuestion > 1) {
        currentQuestion--;
        showQuestion(currentQuestion);
    }
});

// 提交评估
document.getElementById('assessmentForm').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!isCurrentQuestionAnswered()) {
        alert('请完成所有问题');
        return;
    }

    saveAnswer(currentQuestion);

    // 计算总分（不包括Q10_values）
    let totalScore = 0;
    for (let i = 1; i <= totalQuestions; i++) {
        totalScore += answers[`q${i}`] || 0;
    }

    // 保存结果到localStorage
    localStorage.setItem('sleepAssessmentAnswers', JSON.stringify(answers));
    localStorage.setItem('sleepAssessmentScore', totalScore);

    // 跳转到结果页
    window.location.href = 'result.html';
});

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    showQuestion(1);
});

// 监听选项选择
document.querySelectorAll('.option input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
        // 可以在这里添加动画效果
    });
});

// 结果页面逻辑

// 睡眠类型定义
const sleepTypes = {
    typeA: {
        name: '节律紊乱型',
        badge: '节奏失调',
        description: `
            <h2 style="font-size: 1.8rem; margin-bottom: 1.5rem; line-height: 1.4;">你的睡眠不是"坏掉了"，<br>而是节奏乱了。</h2>

            <p>你的作息时间并不稳定，身体很难判断什么时候该清醒、什么时候该休息。</p>

            <p>当生物钟失去参考点，即使你很累，也未必能顺利入睡。</p>

            <p><strong>这不是自律问题，而是节律长期被打断后的自然结果。</strong></p>

            <p>与其强迫自己"早点睡"，更重要的是——<br><strong>重新给身体一个可预测的节奏。</strong></p>

            <div class="hint-box">
                <p class="hint-text">如果你愿意，我可以根据你的实际作息，帮你制定一个不极端、可执行的调整方案。</p>
            </div>
        `
    },
    typeB: {
        name: '高唤醒型',
        badge: '过度警觉',
        description: `
            <h2 style="font-size: 1.8rem; margin-bottom: 1.5rem; line-height: 1.4;">你不是不困，<br>而是你的身体还没"允许你睡"。</h2>

            <p>从你的回答看，你的大脑在夜晚仍然保持着高度警觉。这通常发生在长期紧绷、对睡眠有压力的人身上。</p>

            <p><strong>这并不是意志力问题，也不说明你做错了什么。</strong></p>

            <p>很多人会在这种状态下不断提醒自己"要早点睡"，反而让身体进入更紧张的循环。</p>

            <p>你需要的不是更用力，而是让身体重新学会——<br><strong>什么时候可以慢下来。</strong></p>

            <div class="hint-box">
                <p class="hint-text">如果你愿意，我可以帮你把这些线索整理成一份完整的睡眠分析，告诉你为什么会这样，以及你可以从哪一步开始改变。</p>
            </div>
        `
    },
    typeC: {
        name: '情绪负担型',
        badge: '焦虑主导',
        description: `
            <h2 style="font-size: 1.8rem; margin-bottom: 1.5rem; line-height: 1.4;">你困扰的，<br>可能不只是"睡不着"。</h2>

            <p>从你的回答里，我能看到你对睡眠本身有不少担心。不是现在发生了什么，而是你在反复预想"如果今晚又睡不好怎么办"。</p>

            <p>当睡眠变成一件需要被担心的事，身体往往会先一步紧张起来。</p>

            <p><strong>这并不是你想太多，而是长期压力在寻找出口。</strong></p>

            <p>改善睡眠，有时要从放下对睡眠的警惕开始。</p>

            <div class="hint-box">
                <p class="hint-text">如果你愿意，我可以帮你理清这些情绪和睡眠之间的关系，一步一步拆掉它们之间的死结。</p>
            </div>
        `
    },
    typeD: {
        name: '恢复不足型',
        badge: '质量不佳',
        description: `
            <h2 style="font-size: 1.8rem; margin-bottom: 1.5rem; line-height: 1.4;">你并不是没睡，<br>只是没真正恢复。</h2>

            <p>你可能有一定的睡眠时长，但醒来后依然感到疲惫，甚至比睡前更累。</p>

            <p><strong>这通常意味着：睡眠过程中，身体没有得到充分的修复。</strong></p>

            <p>问题不在"睡多久"，而在睡眠质量和连续性。</p>

            <p>继续单纯延长睡眠时间，并不一定能解决问题。</p>

            <div class="hint-box">
                <p class="hint-text">如果你愿意，我可以帮你找出哪些环节在消耗你的睡眠，以及哪些调整能真正帮你恢复精力。</p>
            </div>
        `
    }
};

// 根据答案判断睡眠类型
function getSleepType(answers) {
    const scores = {
        typeA: 0,  // 节律紊乱型
        typeB: 0,  // 高唤醒型
        typeC: 0,  // 情绪负担型
        typeD: 0   // 恢复不足型
    };

    // 类型 A（节律紊乱型）判断：晚睡 + 白天靠咖啡 + 周末补觉
    // Q4: 入睡时间晚（3或4）
    if (answers.q4 >= 3) {
        scores.typeA += 3;
    }

    // Q10: 依赖咖啡、周末补觉、熬夜补觉
    if (answers.q10_values) {
        if (answers.q10_values.includes('coffee')) scores.typeA += 2;
        if (answers.q10_values.includes('weekend-sleep')) scores.typeA += 2;
        if (answers.q10_values.includes('makeup-sleep')) scores.typeA += 2;
    }

    // 作息不规律相关
    if (answers.q1 >= 3) {  // 入睡时间长
        scores.typeA += 1;
    }

    // 类型 B（高唤醒型）判断：脑子停不下来 + 压力 + 夜醒难睡
    // Q2: 脑子停不下来（值为1表示选了这个）
    if (answers.q2 === 1) {
        scores.typeB += 3;
    }

    // Q3: 上床时有压力（3或4）
    if (answers.q3 >= 3) {
        scores.typeB += 3;
    }

    // Q5: 夜醒后难睡（3或4）
    if (answers.q5 >= 3) {
        scores.typeB += 2;
    }

    // Q1: 入睡时间很长
    if (answers.q1 === 4) {
        scores.typeB += 2;
    }

    // 类型 C（情绪负担型）判断：对睡眠焦虑 + 担心后果 + 情绪波动
    // Q11: 对睡眠焦虑（3或4）
    if (answers.q11 >= 3) {
        scores.typeC += 3;
    }

    // Q12: 担心各种后果
    if (answers.q12 >= 2) {
        scores.typeC += 2;
    }

    // Q9: 情绪波动明显（3或4）
    if (answers.q9 >= 3) {
        scores.typeC += 3;
    }

    // Q3: 上床焦虑
    if (answers.q3 >= 2) {
        scores.typeC += 1;
    }

    // 类型 D（恢复不足型）判断：睡了但不恢复 + 白天疲惫 + 夜间多醒
    // Q7: 醒来疲惫（3或4）
    if (answers.q7 >= 3) {
        scores.typeD += 3;
    }

    // Q8: 白天困倦影响大（3或4）
    if (answers.q8 >= 3) {
        scores.typeD += 3;
    }

    // Q5: 夜间频繁醒（3或4）
    if (answers.q5 >= 3) {
        scores.typeD += 2;
    }

    // Q6: 夜醒时的行为
    if (answers.q6 >= 3) {  // 玩手机或起床
        scores.typeD += 1;
    }

    // 找出得分最高的类型
    let maxScore = 0;
    let resultType = 'typeA';  // 默认

    for (const [type, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            resultType = type;
        }
    }

    // 如果所有得分都很低，根据总分判断一个默认类型
    if (maxScore < 3) {
        const totalScore = Object.values(answers).reduce((sum, val) => {
            if (typeof val === 'number') return sum + val;
            return sum;
        }, 0);

        if (totalScore <= 18) {
            resultType = 'typeA';  // 轻度问题，可能是节律问题
        } else if (totalScore <= 28) {
            resultType = 'typeB';  // 中度问题
        } else {
            resultType = 'typeC';  // 较重问题
        }
    }

    return resultType;
}

// 显示结果
function displayResult() {
    // 从localStorage获取评估结果
    const score = parseInt(localStorage.getItem('sleepAssessmentScore'));
    const answers = JSON.parse(localStorage.getItem('sleepAssessmentAnswers'));

    if (!answers) {
        // 如果没有评估数据，跳转回评估页
        alert('请先完成睡眠评估');
        window.location.href = 'assessment.html';
        return;
    }

    // 判断睡眠类型
    const typeKey = getSleepType(answers);
    const sleepType = sleepTypes[typeKey];

    // 更新页面内容
    document.getElementById('sleepType').textContent = sleepType.name;
    document.getElementById('typeBadge').textContent = sleepType.badge;
    document.getElementById('resultDescription').innerHTML = sleepType.description;

    // 根据类型设置不同的颜色
    const typeBadge = document.getElementById('typeBadge');
    switch(typeKey) {
        case 'typeA':
            typeBadge.style.background = 'linear-gradient(135deg, #7FA59A, #6B8E84)';
            break;
        case 'typeB':
            typeBadge.style.background = 'linear-gradient(135deg, #B08968, #9A7557)';
            break;
        case 'typeC':
            typeBadge.style.background = 'linear-gradient(135deg, #8B7E74, #746860)';
            break;
        case 'typeD':
            typeBadge.style.background = 'linear-gradient(135deg, #A89F91, #948B7E)';
            break;
    }
}

// 页面加载时显示结果
document.addEventListener('DOMContentLoaded', displayResult);

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import Button from '../components/Button';
import Card from '../components/Card';
import axios from 'axios';
import { API_URL } from '../config';

export default function CognitiveTestScreen({ navigation }) {
  const [step, setStep] = useState('intro'); // intro, testing, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'testing') {
      fetchQuestions();
    }
  }, [step]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/data/questions`);
      setQuestions(res.data.questions);
    } catch (e) {
      Alert.alert('Error', 'Failed to load questions');
      setStep('intro');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const currentQ = questions[currentQuestionIndex];
    let isCorrect = false;
    
    // Check answer based on type
    if (currentQ.correct_answer === 'actual_day') {
      // Dynamic check for day
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const today = days[new Date().getDay()];
      if (answer === today) isCorrect = true;
    } else {
      if (answer === currentQ.correct_answer) isCorrect = true;
    }

    if (isCorrect) setScore(s => s + 1);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
    } else {
      finishTest(score + (isCorrect ? 1 : 0));
    }
  };

  const finishTest = async (finalScore) => {
    // Save result
    try {
      await axios.post(`${API_URL}/data/cognitive-test`, {
        patientId: 1, // Demo
        score: finalScore,
        maxScore: questions.length,
        notes: 'Quick Assessment'
      });
    } catch (e) {
      console.log('Failed to save test result');
    }
    setStep('result');
  };

  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <Card style={styles.introCard}>
          <Text style={styles.title}>快速认知评估</Text>
          <Text style={styles.desc}>
            本测试包含 3-5 个简单问题，用于快速评估照护对象的定向力、记忆力和判断力。
            {'\n\n'}预计用时：3 分钟
          </Text>
          <Button title="开始测试" onPress={() => setStep('testing')} />
          <Button title="查看历史记录" type="outline" style={{marginTop: spacing.m}} />
        </Card>
      </View>
    );
  }

  if (step === 'testing') {
    if (loading || questions.length === 0) {
      return (
        <View style={styles.container}>
          <Text>Loading questions...</Text>
        </View>
      );
    }

    const q = questions[currentQuestionIndex];
    return (
      <View style={styles.container}>
        <View style={styles.progress}>
           <Text>问题 {currentQuestionIndex + 1} / {questions.length}</Text>
        </View>
        
        <Card>
          <Text style={styles.questionText}>{q.question}</Text>
          
          <View style={styles.optionsContainer}>
            {q.options.map((opt, idx) => (
              <Button 
                key={idx} 
                title={opt} 
                type="outline" 
                style={styles.optionBtn}
                onPress={() => handleAnswer(opt)} // Simplification: assume option value matches answer key for some types
              />
            ))}
          </View>
        </Card>
      </View>
    );
  }

  if (step === 'result') {
    const ratio = score / questions.length;
    let resultText = '正常';
    let resultColor = colors.success;
    
    if (ratio < 0.6) {
      resultText = '明显下降';
      resultColor = colors.danger;
    } else if (ratio < 0.8) {
      resultText = '轻度下降';
      resultColor = colors.warning;
    }

    return (
      <View style={styles.container}>
        <Card style={styles.resultCard}>
          <Text style={styles.title}>测试完成</Text>
          <Text style={[styles.score, { color: resultColor }]}>{resultText}</Text>
          <Text style={styles.desc}>
            得分: {score} / {questions.length}
          </Text>
          <Text style={styles.suggestion}>
            建议：{ratio < 0.8 ? '建议近期增加陪伴时间，并参考“知识社区”中的认知训练文章。' : '状况良好，请继续保持日常交流与活动。'}
          </Text>
          <Button title="返回首页" onPress={() => navigation.navigate('Home')} />
        </Card>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.m,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
  },
  introCard: {
    padding: spacing.l,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.m,
  },
  desc: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.l,
    lineHeight: 24,
  },
  progress: {
    marginBottom: spacing.m,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
  },
  optionBtn: {
    marginBottom: spacing.m,
  },
  resultCard: {
    padding: spacing.l,
    alignItems: 'center',
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.s,
  },
  suggestion: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.m,
    backgroundColor: colors.background.main,
    padding: spacing.m,
    borderRadius: borderRadius.m,
  }
});

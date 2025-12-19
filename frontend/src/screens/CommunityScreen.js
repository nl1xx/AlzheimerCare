import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal, TextInput, Alert } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('cognitive');
  const [articles, setArticles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  
  const { token } = useAuth();

  const TABS = [
    { id: 'cognitive', label: '认知与疾病' },
    { id: 'care', label: '日常照护' },
    { id: 'behavior', label: '行为管理' },
    { id: 'psychology', label: '照护者心理' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch articles based on category
      const articlesRes = await axios.get(`${API_URL}/community/articles?category=${activeTab}`);
      setArticles(articlesRes.data.articles);
      
      // Fetch all posts (could filter by category too if needed)
      const postsRes = await axios.get(`${API_URL}/community/posts`);
      setPosts(postsRes.data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle || !newPostContent) return Alert.alert('提示', '请填写完整标题和内容');
    
    try {
      await axios.post(
        `${API_URL}/community/posts`, 
        { title: newPostTitle, content: newPostContent, category: activeTab },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalVisible(false);
      setNewPostTitle('');
      setNewPostContent('');
      fetchData(); // Refresh
      Alert.alert('成功', '发布成功');
    } catch (e) {
      Alert.alert('失败', '发布失败，请检查登录状态');
    }
  };

  const renderArticle = ({ item }) => (
    <Card key={item.id}>
      <Text style={styles.articleTitle}>{item.title}</Text>
      <Text style={styles.articleDesc} numberOfLines={2}>{item.content}</Text>
      <Text style={styles.meta}>阅读 {item.read_time}分钟 • {item.is_expert_verified ? '专家认证' : '社区贡献'}</Text>
    </Card>
  );

  const renderPost = ({ item }) => (
    <Card key={item.id}>
      <Text style={styles.qTitle}>Q: {item.title}</Text>
      <Text style={styles.qDesc} numberOfLines={2}>{item.content}</Text>
      <Text style={styles.meta}>{item.likes} 点赞 • 作者: {item.author || '匿名'}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.m }}>
        {/* 5.1 Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Articles */}
            <Text style={styles.sectionHeader}>精选文章</Text>
            {articles.length > 0 ? (
              articles.map(item => renderArticle({ item }))
            ) : (
              <Text style={styles.emptyText}>暂无相关文章</Text>
            )}

            {/* Community */}
            <Text style={styles.sectionHeader}>社区互助</Text>
            {posts.length > 0 ? (
              posts.map(item => renderPost({ item }))
            ) : (
              <Text style={styles.emptyText}>暂无讨论</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>发布新问题</Text>
            <TextInput 
              style={styles.input} 
              placeholder="标题" 
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              placeholder="详细描述您的疑问..." 
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />
            <View style={styles.modalButtons}>
              <Button title="取消" type="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="发布" onPress={handleCreatePost} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  tabs: {
    marginBottom: spacing.l,
    flexDirection: 'row',
    height: 40,
  },
  tab: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    marginRight: spacing.s,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    height: 36,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.white,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    marginTop: spacing.s,
    color: colors.text.primary,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.s,
  },
  articleDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.s,
  },
  meta: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.s,
  },
  qTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.s,
  },
  qDesc: {
    fontSize: 14,
    color: colors.text.primary,
  },
  emptyText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.m,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.l,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: borderRadius.m,
    padding: spacing.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background.main,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    marginBottom: spacing.m,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});

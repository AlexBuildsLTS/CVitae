/* cspell:disable */
/**
 * @file app/admin/projects.tsx
 * @description Enterprise-grade Project Registry Management System.
 * @version 8.0.0
 * * IMPROVEMENTS:
 * - Refactored into a modular architecture for better maintainability.
 * - Optimized rendering performance using FlatList and memoized components.
 * - Enhanced error handling and input validation.
 * - Centralized logic into a custom useProjects hook.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Modal,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

/**
 * --- ICONOGRAPHY MODULE ---
 */
import {
  Plus,
  Layers,
  Trash2,
  Edit3,
  X,
  Save,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Image as ImageIcon,
  LogOut,
} from 'lucide-react-native';

// --- SYSTEM CORE ---
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

// Enforce layout engine on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * --- DATA MODELS ---
 */
interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  github_url: string | null;
  live_url: string | null;
  tags: string[];
  display_order: number;
  created_at: string;
}

/**
 * --- CUSTOM HOOKS ---
 */
const useProjects = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  const fetchRegistry = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (e: any) {
      console.error('[REGISTRY_SYNC_FAIL]:', e.message);
      Alert.alert('Registry Error', 'Failed to synchronize with cloud.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert('SYSTEM_EXIT', 'Confirm session termination?', [
      { text: 'ABORT', style: 'cancel' },
      {
        text: 'SIGN_OUT',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          } catch (e) {
            router.replace('/');
          }
        },
      },
    ]);
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    setSaving(true);
    const itemA = projects[index];
    const itemB = projects[targetIdx];

    try {
      // Atomic updates for order swap
      const { error: err1 } = await supabase
        .from('projects')
        .update({ display_order: itemB.display_order })
        .eq('id', itemA.id);
      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from('projects')
        .update({ display_order: itemA.display_order })
        .eq('id', itemB.id);
      if (err2) throw err2;

      // Optimistic UI update
      const updatedSet = [...projects];
      const tempOrder = itemA.display_order;
      itemA.display_order = itemB.display_order;
      itemB.display_order = tempOrder;

      updatedSet[index] = itemB;
      updatedSet[targetIdx] = itemA;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setProjects(updatedSet);
    } catch (e: any) {
      Alert.alert('Reorder Error', e.message);
      fetchRegistry();
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      fetchRegistry();
    } catch (e: any) {
      Alert.alert('Deletion Error', e.message);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  return {
    loading,
    refreshing,
    saving,
    setSaving,
    projects,
    fetchRegistry,
    handleLogout,
    handleReorder,
    deleteProject,
  };
};

/**
 * --- SUB-COMPONENTS ---
 */

const ProjectCard = React.memo(({ 
  project, 
  index, 
  isFirst, 
  isLast, 
  onReorder, 
  onEdit, 
  onDelete, 
  cardWidth 
}: { 
  project: Project; 
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (index: number, dir: 'up' | 'down') => void;
  onEdit: (p: Project) => void;
  onDelete: (id: number) => void;
  cardWidth: any;
}) => (
  <View style={[styles.gridItem, { width: cardWidth }]}>
    <GlassCard style={styles.projectCard}>
      <View style={styles.imageHost}>
        <Image
          source={
            project.image_url
              ? { uri: project.image_url }
              : require('../../assets/images/Northm.png')
          }
          style={styles.projectImage}
          contentFit="cover"
          transition={500}
          priority="high"
        />
        <View style={styles.orderTag}>
          <Text style={styles.orderLabel}>
            INDEX_{String(project.display_order).padStart(2, '0')}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {project.title}
        </Text>
        <Text style={styles.projectDesc} numberOfLines={2}>
          {project.description}
        </Text>

        <View style={styles.tagStrip}>
          {project.tags?.slice(0, 3).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={() => onReorder(index, 'up')}
            disabled={isFirst}
            style={[styles.utilBtn, isFirst && styles.disabledBtn]}
          >
            <ChevronUp size={16} color={isFirst ? '#333' : 'white'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReorder(index, 'down')}
            disabled={isLast}
            style={[styles.utilBtn, isLast && styles.disabledBtn]}
          >
            <ChevronDown size={16} color={isLast ? '#333' : 'white'} />
          </TouchableOpacity>

          <View style={styles.sep} />

          <TouchableOpacity onPress={() => onEdit(project)} style={styles.utilBtn}>
            <Edit3 size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Confirm Deletion', 'Permanent removal of this record?', [
                { text: 'CANCEL', style: 'cancel' },
                { text: 'DELETE', style: 'destructive', onPress: () => onDelete(project.id) },
              ])
            }
            style={styles.utilBtn}
          >
            <Trash2 size={16} color={COLORS.error} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
          <View style={styles.externalBtn}>
            <ArrowUpRight size={14} color="black" />
          </View>
        </View>
      </View>
    </GlassCard>
  </View>
));

/**
 * --- MAIN COMPONENT ---
 */
export default function ProjectsManagement() {
  const { width } = useWindowDimensions();
  const {
    loading,
    refreshing,
    saving,
    setSaving,
    projects,
    fetchRegistry,
    handleLogout,
    handleReorder,
    deleteProject,
  } = useProjects();

  // Layout Engine
  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  const cardWidth = useMemo(() => {
    if (isDesktop) return '31.5%';
    if (isTablet) return '48%';
    return '100%';
  }, [isDesktop, isTablet]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [tempTags, setTempTags] = useState<string>('');

  const initiateProjectModal = useCallback((project: Project | null = null) => {
    if (project) {
      setEditingProject(project);
      setTempTags(project.tags ? project.tags.join(', ') : '');
    } else {
      setEditingProject({
        title: '',
        description: '',
        github_url: '',
        live_url: '',
        tags: [],
        display_order: projects.length > 0
          ? Math.max(...projects.map((p) => p.display_order)) + 1
          : 1,
      });
      setTempTags('');
    }
    setModalVisible(true);
  }, [projects]);

  const handleAssetPipeline = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSaving(true);
      try {
        const file = result.assets[0];
        const fileName = `projects/asset_${Date.now()}.jpg`;

        const raw = atob(file.base64!);
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);

        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, uint8, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName);
          
        setEditingProject((prev) => ({ ...prev, image_url: publicUrl }));
      } catch (e: any) {
        Alert.alert('Upload Failure', e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const commitProjectToCloud = async () => {
    if (!editingProject?.title || !editingProject?.description) {
      Alert.alert('Validation Error', 'Title and Description are required.');
      return;
    }

    setSaving(true);
    const parsedTags = tempTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');
    const payload = { ...editingProject, tags: parsedTags };

    try {
      const { error } = editingProject.id
        ? await supabase.from('projects').update(payload).eq('id', editingProject.id)
        : await supabase.from('projects').insert([payload]);

      if (error) throw error;

      setModalVisible(false);
      fetchRegistry();
      Alert.alert('Success', 'Registry synchronized.');
    } catch (e: any) {
      Alert.alert('Sync Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingLabel}>SYNCHRONIZING_REGISTRY...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerInfo}>
          <View style={styles.iconContainer}>
            <Layers size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>Work Registry</Text>
            <Text style={styles.subtitle}>
              {projects.length} System Records Active
            </Text>
          </View>
        </View>

        <View style={[styles.headerActions, isMobile && { width: '100%' }]}>
          <TouchableOpacity
            onPress={() => initiateProjectModal()}
            style={[styles.addBtn, isMobile && { flex: 1 }]}
          >
            <Plus size={18} color="black" />
            <Text style={styles.addBtnText}>New Project</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtnSmall}>
            <LogOut size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={projects}
        renderItem={({ item, index }) => (
          <ProjectCard
            project={item}
            index={index}
            isFirst={index === 0}
            isLast={index === projects.length - 1}
            onReorder={handleReorder}
            onEdit={initiateProjectModal}
            onDelete={deleteProject}
            cardWidth={cardWidth}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={isDesktop ? 3 : isTablet ? 2 : 1}
        key={isDesktop ? 'd' : isTablet ? 't' : 'm'} // Force re-render on column change
        contentContainerStyle={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRegistry}
            tintColor={COLORS.primary}
          />
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <GlassCard style={[styles.modalBox, isDesktop && { width: 680 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject?.id ? 'UPDATE_RECORD' : 'NEW_RECORD'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={(i) => i.toString()}
              renderItem={() => (
                <View>
                  <TouchableOpacity onPress={handleAssetPipeline} style={styles.imageField}>
                    {editingProject?.image_url ? (
                      <Image
                        source={{ uri: editingProject.image_url }}
                        style={styles.fullPreview}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.fieldEmpty}>
                        <ImageIcon size={32} color={COLORS.textDim} />
                        <Text style={styles.fieldLabel}>Upload Production Asset (16:9)</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.formArea}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Registry Title</Text>
                      <TextInput
                        style={styles.input}
                        value={editingProject?.title}
                        onChangeText={(t) => setEditingProject({ ...editingProject, title: t })}
                        placeholder="Enter project title"
                        placeholderTextColor="#444"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Technical Description</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={editingProject?.description}
                        onChangeText={(t) => setEditingProject({ ...editingProject, description: t })}
                        multiline
                        numberOfLines={4}
                        placeholder="Detailed technical breakdown"
                        placeholderTextColor="#444"
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Sort Index</Text>
                        <TextInput
                          style={styles.input}
                          value={String(editingProject?.display_order || '')}
                          keyboardType="numeric"
                          onChangeText={(t) =>
                            setEditingProject({
                              ...editingProject,
                              display_order: parseInt(t) || 0,
                            })
                          }
                        />
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.label}>Stack Tags</Text>
                        <TextInput
                          style={styles.input}
                          value={tempTags}
                          onChangeText={setTempTags}
                          placeholder="React, Node, Java"
                          placeholderTextColor="#444"
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Source Code URL (GitHub)</Text>
                      <TextInput
                        style={styles.input}
                        value={editingProject?.github_url || ''}
                        onChangeText={(t) => setEditingProject({ ...editingProject, github_url: t })}
                        autoCapitalize="none"
                        placeholder="https://github.com/..."
                        placeholderTextColor="#444"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Live Deployment URL</Text>
                      <TextInput
                        style={styles.input}
                        value={editingProject?.live_url || ''}
                        onChangeText={(t) => setEditingProject({ ...editingProject, live_url: t })}
                        autoCapitalize="none"
                        placeholder="https://project.com"
                        placeholderTextColor="#444"
                      />
                    </View>

                    <TouchableOpacity
                      onPress={commitProjectToCloud}
                      disabled={saving}
                      style={[styles.commitBtn, saving && { opacity: 0.5 }]}
                    >
                      {saving ? (
                        <ActivityIndicator color="black" />
                      ) : (
                        <>
                          <Save size={20} color="black" />
                          <Text style={styles.commitText}>COMMIT_CHANGES</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLabel: {
    color: COLORS.textDim,
    marginTop: SPACING.m,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  scrollArea: { 
    padding: SPACING.l,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 24 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(204,255,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.1)',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  addBtnText: { color: 'black', fontWeight: '900', fontSize: 14 },
  logoutBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,50,50,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItem: { 
    padding: 8,
  },
  projectCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#151515',
  },
  imageHost: { width: '100%', height: 180, backgroundColor: '#0d0d0d' },
  projectImage: { width: '100%', height: '100%' },
  orderTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  orderLabel: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },
  cardContent: { padding: 22 },
  projectTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  projectDesc: {
    color: COLORS.textDim,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 18,
  },
  tagStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  tagText: { color: COLORS.textDim, fontSize: 9, fontWeight: '700' },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#151515',
  },
  utilBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  sep: { width: 1, height: 20, backgroundColor: '#222', marginHorizontal: 4 },
  externalBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  imageField: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 28,
  },
  fullPreview: { width: '100%', height: '100%' },
  fieldEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: { color: COLORS.textDim, fontSize: 12, fontWeight: '700' },
  formArea: { gap: 20 },
  fieldGroup: { gap: 10 },
  row: { flexDirection: 'row', gap: 14 },
  label: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#0d0d0d',
    padding: 18,
    borderRadius: 18,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  commitBtn: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  commitText: { color: 'black', fontWeight: '900', fontSize: 16 },
});

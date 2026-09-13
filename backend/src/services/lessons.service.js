const supabase = require('../config/supabase');

const DEFAULT_LESSON_LIMIT = 3;

/**
 * Cross-session self-improvement: when the ExplainerAgent's self-check pass
 * catches a mistake, it's recorded here. Future narrative-generation calls
 * for the same intent retrieve recent lessons and are warned not to repeat
 * them — a persistent, retrieval-based feedback loop rather than model
 * fine-tuning (no training pipeline or dataset required).
 */
class LessonsService {
  static async recordLesson(intent, issue) {
    if (!intent || !issue) return;

    const { error } = await supabase
      .from('agent_lessons')
      .insert({ intent, issue });

    if (error) {
      console.warn('[LessonsService] Failed to record lesson:', error.message);
    }
  }

  static async getRecentLessons(intent, limit = DEFAULT_LESSON_LIMIT) {
    if (!intent) return [];

    const { data, error } = await supabase
      .from('agent_lessons')
      .select('issue, created_at')
      .eq('intent', intent)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[LessonsService] Failed to fetch lessons:', error.message);
      return [];
    }

    return (data || []).map(l => l.issue);
  }
}

module.exports = LessonsService;

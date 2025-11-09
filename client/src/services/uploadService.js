import { supabase } from '../config/supabase';

const BUCKET_NAME = 'huit-social-credits';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadService = {
  /**
   * Upload ảnh avatar
   */
  async uploadAvatar(file, userId) {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File quá lớn. Kích thước tối đa 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        path: data.path,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw new Error(error.message || 'Không thể upload avatar');
    }
  },

  /**
   * Upload ảnh bìa hoạt động
   */
  async uploadActivityCover(file, activityId) {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File quá lớn. Kích thước tối đa 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `activities/${activityId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        path: data.path,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Upload activity cover error:', error);
      throw new Error(error.message || 'Không thể upload ảnh bìa');
    }
  },

  /**
   * Upload ảnh điểm danh
   */
  async uploadAttendancePhoto(file, userId, activityId) {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File quá lớn. Kích thước tối đa 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `attendance/${activityId}/${userId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        path: data.path,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Upload attendance photo error:', error);
      throw new Error(error.message || 'Không thể upload ảnh điểm danh');
    }
  },

  /**
   * Upload minh chứng feedback
   */
  async uploadFeedbackEvidence(file, userId, activityId) {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File quá lớn. Kích thước tối đa 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `feedback/${activityId}/${userId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        path: data.path,
        url: publicUrl,
      };
    } catch (error) {
      console.error('Upload feedback evidence error:', error);
      throw new Error(error.message || 'Không thể upload minh chứng');
    }
  },

  /**
   * Xóa file
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error(error.message || 'Không thể xóa file');
    }
  },

  /**
   * Upload multiple files (feedback evidence)
   */
  async uploadMultipleFiles(files, userId, activityId) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFeedbackEvidence(file, userId, activityId)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Upload multiple files error:', error);
      throw new Error(error.message || 'Không thể upload nhiều file');
    }
  },
};

export default uploadService;
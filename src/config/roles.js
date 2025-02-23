const roles = {
  admin: [
    'manage_users',
    'manage_music',
    'manage_playlists',
    'upload_music',
    'edit_metadata',
    'view_statistics',
    'delete_music',
  ],
  artist: ['upload_music', 'edit_metadata', 'delete_music'],
};

module.exports = roles;

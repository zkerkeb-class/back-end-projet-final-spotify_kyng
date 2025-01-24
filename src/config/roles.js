const roles = {
  admin: ['read_music','manage_users', 'manage_music', 'view_statistics', 'manage_playlists'],
  artist: ['read_music','upload_music', 'edit_metadata', 'view_statistics'],
  user: ['read_music', 'create_playlist'],
  guest: ['read_music'],
};

module.exports = roles;

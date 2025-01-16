const roles = {
  admin: [
    'manage_users',  
    'manage_music',     
    'view_statistics',  
    'manage_playlists',  
  ],
  artist: [
    'upload_music',      
    'edit_metadata',     
    'view_statistics',   
  ],
 /* listener: [
    'play_music',       
    'create_playlist',  
    'like_music',       
    'follow_artist',     
  ],
  guest: [
    'preview_music',     
  ],*/
};

module.exports = roles;

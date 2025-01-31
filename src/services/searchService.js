const natural = require('natural');
// const metaphone = natural.Metaphone;
const mongoose = require('mongoose');
const levenshtein = natural.LevenshteinDistance;
const Album = require('../models/Album')(mongoose);
const Artist = require('../models/Artist')(mongoose);
const Track = require('../models/Track')(mongoose);
const DoubleMetaphone = natural.DoubleMetaphone;
const doubleMetaphone = new DoubleMetaphone();

// const search = async (query, page = 1, limit = 10) => {
//   try {
//     const results = {
//       exactMatches: [],
//       phoneticMatches: [],
//       trackMatches: []
//     };

//     await Promise.all([
//       findExactMatches(query, results),
//       findPhoneticMatches(query, results),
//       findTrackMatches(query, results)
//     ]);

//     const combinedResults = rankAndCombineResults(results);

//     return {
//       results: combinedResults.slice((page - 1) * limit, page * limit),
//       total: combinedResults.length,
//       page,
//       totalPages: Math.ceil(combinedResults.length / limit)
//     };
//   } catch (error) {
//     throw new Error(`Search error: ${error.message}`);
//   }
// };

// const findExactMatches = async (query, results) => {
//   const searchTerms = query.split(' ').filter(term => term.length > 2);

//   const albumMatches = await Album.find({
//     $or: searchTerms.map(term => ({
//       $or: [
//         { title: { $regex: term, $options: 'i' } },
//         { genres: { $regex: term, $options: 'i' } }
//       ]
//     }))
//   }).populate('artistId');

//   const artistMatches = await Artist.find({
//     $or: searchTerms.map(term => ({
//       $or: [
//         { name: { $regex: term, $options: 'i' } },
//         { genres: { $regex: term, $options: 'i' } }
//       ]
//     }))
//   });

//   results.exactMatches = [
//     ...albumMatches.map(album => ({ type: 'album', data: album, score: 1.0 })),
//     ...artistMatches.map(artist => ({ type: 'artist', data: artist, score: 1.0 }))
//   ];
// };

// const findPhoneticMatches = async (query, results) => {
//   const queryPhonetic = doubleMetaphone.process(query);
//   const artists = await Artist.find();

//   results.phoneticMatches = artists
//     .filter(artist => {
//       const distance = levenshtein(
//         doubleMetaphone.process(artist.name),
//         queryPhonetic
//       );
//       return distance <= 2;
//     })
//     .map(artist => ({ type: 'artist', data: artist, score: 0.7 }));
// };

// const findTrackMatches = async (query, results) => {
//   results.trackMatches = await Track.find({
//     $or: [
//       { title: { $regex: query, $options: 'i' } },
//       { lyrics: { $regex: query, $options: 'i' } }
//     ]
//   })
//     .populate('artistId albumId')
//     .then(tracks => tracks.map(track => ({
//       type: 'track',
//       data: track,
//       score: track.lyrics?.includes(query) ? 0.5 : 0.8
//     })));
// };

// const rankAndCombineResults = (results) => {
//   return [...results.exactMatches, ...results.phoneticMatches, ...results.trackMatches]
//     .sort((a, b) => b.score - a.score)
//     .filter((result, index, self) =>
//       index === self.findIndex(r =>
//         r.type === result.type && r.data._id.toString() === result.data._id.toString()
//       )
//     );
// };


const search = async (query, page = 1, limit = 10) => {
  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    const results = await Promise.all([
      searchTracks(searchTerms),
      searchArtists(searchTerms),
      searchAlbums(searchTerms)
    ]);

    const rankedResults = rankResults(results.flat(), searchTerms);

    return {
      results: rankedResults.slice((page - 1) * limit, page * limit),
      total: rankedResults.length,
      page,
      totalPages: Math.ceil(rankedResults.length / limit)
    };
  } catch (error) {
    throw new Error(`Search error: ${error.message}`);
  }
};

const searchTracks = async (searchTerms) => {
  const tracks = await Track.find({
    $or: [
      { title: { $regex: searchTerms.join('|'), $options: 'i' } },
      { lyrics: { $regex: searchTerms.join('|'), $options: 'i' } }
    ]
  }).populate('artistId albumId');

  return tracks.map(track => ({
    type: 'track',
    data: track,
    score: calculateTrackScore(track, searchTerms)
  }));
};

const searchArtists = async (searchTerms) => {
  const artists = await Artist.find({
    $or: [
      { name: { $regex: searchTerms.join('|'), $options: 'i' } },
      { genres: { $regex: searchTerms.join('|'), $options: 'i' } }
    ]
  });

  return artists.map(artist => ({
    type: 'artist',
    data: artist,
    score: calculateArtistScore(artist, searchTerms)
  }));
};

const searchAlbums = async (searchTerms) => {
  const albums = await Album.find({
    $or: [
      { title: { $regex: searchTerms.join('|'), $options: 'i' } },
      { genres: { $regex: searchTerms.join('|'), $options: 'i' } }
    ]
  }).populate('artistId');

  return albums.map(album => ({
    type: 'album',
    data: album,
    score: calculateAlbumScore(album, searchTerms)
  }));
};

const calculateTrackScore = (track, searchTerms) => {
  let score = 0;
  const trackTitle = track.title.toLowerCase();
  const lyrics = track.lyrics?.toLowerCase() || '';
  const artistName = track.artistId?.name.toLowerCase() || '';

  // Exact title match
  if (searchTerms.join(' ') === trackTitle) score += 100;
  
  // Title word matches
  searchTerms.forEach(term => {
    if (trackTitle.startsWith(term)) score += 50;
    if (trackTitle.includes(term)) score += 30;
  });

  // Artist name matches
  searchTerms.forEach(term => {
    if (artistName.includes(term)) score += 40;
  });

  // Lyrics matches
  searchTerms.forEach(term => {
    if (lyrics.includes(term)) {
      score += 20;
      const occurrences = (lyrics.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(occurrences, 5) * 2;
    }
  });

  // Popularity boost
  score += (track.popularity || 0) * 0.1;
  score += (track.numberOfListens || 0) * 0.01;

  return score;
};

const calculateArtistScore = (artist, searchTerms) => {
  let score = 0;
  const artistName = artist.name.toLowerCase();

  // Exact artist name match
  if (searchTerms.join(' ') === artistName) score += 100;
  
  // Partial matches
  searchTerms.forEach(term => {
    if (artistName.startsWith(term)) score += 60;
    if (artistName.includes(term)) score += 40;
    
    // Genre matches
    if (artist.genres?.toLowerCase().includes(term)) score += 20;
  });

  // Phonetic matching
  const namePhonetic = doubleMetaphone.process(artistName);
  searchTerms.forEach(term => {
    const termPhonetic = doubleMetaphone.process(term);
    const distance = natural.LevenshteinDistance(namePhonetic, termPhonetic);
    if (distance <= 2) score += 30;
  });

  return score;
};

const calculateAlbumScore = (album, searchTerms) => {
  let score = 0;
  const albumTitle = album.title.toLowerCase();
  const artistName = album.artistId?.name.toLowerCase() || '';

  // Exact album title match
  if (searchTerms.join(' ') === albumTitle) score += 100;
  
  // Partial matches
  searchTerms.forEach(term => {
    if (albumTitle.startsWith(term)) score += 50;
    if (albumTitle.includes(term)) score += 30;
    if (artistName.includes(term)) score += 40;
    if (album.genres?.toLowerCase().includes(term)) score += 20;
  });

  // Newer albums get slight boost
  if (album.releaseDate) {
    const yearsOld = new Date().getFullYear() - new Date(album.releaseDate).getFullYear();
    score += Math.max(0, 10 - yearsOld);
  }

  return score;
};

const rankResults = (results, searchTerms) => {
  return results
    .sort((a, b) => b.score - a.score)
    .filter((result, index, self) => 
      index === self.findIndex(r => 
        r.type === result.type && r.data._id.toString() === result.data._id.toString()
      )
    );
};

module.exports = {
  search
}

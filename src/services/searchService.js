const natural = require('natural');
const mongoose = require('mongoose');
const levenshtein = natural.LevenshteinDistance;
const Album = require('../models/Album')(mongoose);
const Artist = require('../models/Artist')(mongoose);
const Track = require('../models/Track')(mongoose);
const DoubleMetaphone = natural.DoubleMetaphone;
const doubleMetaphone = new DoubleMetaphone();
const Joi = require('joi');
const logger = require('../utils/logger');

// Constants for scoring weights
const SCORE_WEIGHTS = {
  EXACT_MATCH: 100,
  STARTS_WITH: 90,
  CONTAINS: 70,
  PHONETIC_MATCH: 80,
  NO_VOWELS_MATCH: 60,
  GENRE_MATCH: 20,
  LYRICS_MATCH: 20,
  TEMPO_MATCH: 30,
  MOOD_MATCH: 30,
  GENRE_OVERLAP: 20,
};

// Joi schema for validating query and pagination parameters
const searchSchema = Joi.object({
  query: Joi.string().min(1).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

const search = async (query, page = 1, limit = 10) => {
  // Validate input
  const { error, value } = searchSchema.validate({ query, page, limit });
  if (error) {
    logger.error(`Validation error: ${error.message}`);
    throw new Error(`Invalid input: ${error.message}`);
  }

  try {
    const searchTerms = normalizeSearchTerms(value.query);
    const results = await Promise.all([
      searchTracks(searchTerms, value.query),
      searchArtists(searchTerms),
      searchAlbums(searchTerms),
      searchLyrics(searchTerms),
    ]);

    const rankedResults = rankResults(results.flat());

    return {
      results: rankedResults.slice((value.page - 1) * value.limit, value.page * value.limit),
      total: rankedResults.length,
      page: value.page,
      totalPages: Math.ceil(rankedResults.length / value.limit),
    };
  } catch (error) {
    logger.error(`Search error: ${error.message}`);
    throw new Error(`Search error: ${error.message}`);
  }
};

const normalizeSearchTerms = (query) => {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(' ')
    .filter((term) => term.length > 1);
};

const searchArtists = async (searchTerms) => {
  logger.info('Searching artists...');
  const artists = await Artist.find({
    $or: [
      buildArtistMatchQuery(searchTerms),
      {
        name: {
          $in: searchTerms.map((term) => new RegExp(term.replace(/[aeiou]/g, '[aeiou]?'), 'i')),
        },
      },
      {
        name: {
          $in: searchTerms.map((term) => new RegExp(`${term}.*`, 'i')),
        },
      },
    ],
  });

  return artists.map((artist) => ({
    type: 'artist',
    data: artist,
    score: calculateArtistScore(artist, searchTerms),
  }));
};

const searchTracks = async (searchTerms, originalQuery) => {
  logger.info('Searching tracks...');

  const tracks = await Track.find({
    $or: [
      { title: { $regex: `^${originalQuery}$`, $options: 'i' } }, // Exact match
      { title: { $regex: originalQuery, $options: 'i' } }, // Contains query
      { title: { $regex: buildLooseSearchPattern(searchTerms), $options: 'i' } }, // Loose match
    ],
  }).populate('artistId albumId');

  return tracks.map((track) => ({
    type: 'track',
    data: track,
    score:
      track.title.toLowerCase() === originalQuery.toLowerCase()
        ? SCORE_WEIGHTS.EXACT_MATCH
        : calculateTrackScore(track, searchTerms),
  }));
};

const buildLooseSearchPattern = (terms) => {
  return terms.map((term) => `(?=.*${term})`).join('');
};

const searchAlbums = async (searchTerms) => {
  logger.info('Searching albums...');
  const albums = await Album.find({
    $or: [
      { title: { $regex: buildSearchPattern(searchTerms), $options: 'i' } },
      { genres: { $regex: buildSearchPattern(searchTerms), $options: 'i' } },
    ],
  }).populate('artistId');

  return albums.map((album) => ({
    type: 'album',
    data: album,
    score: calculateAlbumScore(album, searchTerms),
  }));
};

const buildArtistMatchQuery = (searchTerms) => ({
  $or: [
    { name: { $regex: buildSearchPattern(searchTerms), $options: 'i' } },
    { genres: { $regex: buildSearchPattern(searchTerms), $options: 'i' } },
    {
      name: {
        $in: searchTerms.map((term) => {
          const phoneticCode = doubleMetaphone.process(term);
          return new RegExp(phoneticCode, 'i');
        }),
      },
    },
  ],
});

const calculateTrackScore = (track, searchTerms) => {
  let score = 0;
  const normalizedTitle = normalize(track.title);
  const artistName = normalize(track.artistId?.name);
  const lyrics = normalize(track.lyrics);

  searchTerms.forEach((term) => {
    const variations = getTermVariations(term);
    const phoneticTerm = doubleMetaphone.process(term);

    variations.forEach((variant) => {
      const phoneticArtistName = doubleMetaphone.process(artistName);
      const nameDistance = levenshtein(phoneticArtistName, phoneticTerm);
      if (nameDistance <= 2) {
        score += SCORE_WEIGHTS.PHONETIC_MATCH - nameDistance * 20;
      }

      if (artistName.includes(variant)) score += SCORE_WEIGHTS.CONTAINS;
      if (normalizedTitle.includes(variant)) score += SCORE_WEIGHTS.CONTAINS;
      if (lyrics?.includes(variant)) score += SCORE_WEIGHTS.LYRICS_MATCH;

      const noVowelsVariant = variant.replace(/[aeiou]/g, '');
      const noVowelsName = artistName.replace(/[aeiou]/g, '');
      if (noVowelsName.includes(noVowelsVariant)) score += SCORE_WEIGHTS.NO_VOWELS_MATCH;
    });
  });

  return score;
};

const calculateArtistScore = (artist, searchTerms) => {
  let score = 0;
  const normalizedName = normalize(artist.name);

  searchTerms.forEach((term) => {
    const variations = getTermVariations(term);
    const phoneticTerm = doubleMetaphone.process(term);

    variations.forEach((variant) => {
      const phoneticName = doubleMetaphone.process(normalizedName);
      const nameDistance = levenshtein(phoneticName, phoneticTerm);

      if (normalizedName.startsWith(variant)) score += SCORE_WEIGHTS.STARTS_WITH;
      if (nameDistance <= 2) score += SCORE_WEIGHTS.PHONETIC_MATCH - nameDistance * 20;
      if (normalizedName.includes(variant)) score += SCORE_WEIGHTS.CONTAINS;

      const noVowelsVariant = variant.replace(/[aeiou]/g, '');
      const noVowelsName = normalizedName.replace(/[aeiou]/g, '');
      if (noVowelsName.includes(noVowelsVariant)) score += SCORE_WEIGHTS.NO_VOWELS_MATCH;

      if (artist.genres?.toLowerCase().includes(variant)) score += SCORE_WEIGHTS.GENRE_MATCH;
    });
  });

  return score;
};

const calculateAlbumScore = (album, searchTerms) => {
  let score = 0;
  const normalizedTitle = normalize(album.title);
  const artistName = normalize(album.artistId?.name);

  searchTerms.forEach((term) => {
    const variations = getTermVariations(term);
    variations.forEach((variant) => {
      if (normalizedTitle === variant) score += SCORE_WEIGHTS.EXACT_MATCH;
      if (normalizedTitle.startsWith(variant)) score += SCORE_WEIGHTS.STARTS_WITH;
      if (normalizedTitle.includes(variant)) score += SCORE_WEIGHTS.CONTAINS;
      if (artistName?.includes(variant)) score += SCORE_WEIGHTS.CONTAINS;

      const noVowelsVariant = variant.replace(/[aeiou]/g, '');
      const noVowelsTitle = normalizedTitle.replace(/[aeiou]/g, '');
      if (noVowelsTitle.includes(noVowelsVariant)) score += SCORE_WEIGHTS.NO_VOWELS_MATCH;
    });
  });

  return score;
};

const normalize = (text) => {
  return text
    ? text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';
};

const buildSearchPattern = (terms) => {
  return terms.map((term) => `(?=.*${term})`).join('');
};

const getTermVariations = (term) => {
  const variations = [term];
  const phoneticCode = doubleMetaphone.process(term);

  // Ensure phoneticCode is always a string
  if (Array.isArray(phoneticCode)) {
    phoneticCode.forEach((code) => {
      if (typeof code === 'string' && code.length > 0) {
        variations.push(code);
      }
    });
  } else if (typeof phoneticCode === 'string' && phoneticCode.length > 0) {
    variations.push(phoneticCode);
  }

  // Add common variations
  if (term.length <= 4) {
    variations.push(...generateCommonVariations(term));
  }

  return variations;
};

const generateCommonVariations = (term) => {
  const commonVariations = {
    bili: ['billie', 'billy', 'billi'],
    moris: ['maurice', 'morris', 'moriss'],
  };

  return commonVariations[term] || [];
};

const rankResults = (results) => {
  return results
    .sort((a, b) => b.score - a.score)
    .filter((result, index, self) => {
      return (
        index ===
        self.findIndex(
          (r) => r.type === result.type && r.data._id.toString() === result.data._id.toString()
        )
      );
    });
};

const searchLyrics = async (searchTerms) => {
  logger.info('Searching lyrics...');
  const tracks = await Track.find({
    lyrics: { $regex: buildSearchPattern(searchTerms), $options: 'i' },
  }).populate('artistId albumId');

  return tracks.map((track) => ({
    type: 'track',
    data: track,
    score: calculateLyricsScore(track, searchTerms),
  }));
};
const calculateLyricsScore = (track, searchTerms) => {
  let score = 0;
  const lyrics = normalize(track.lyrics);

  searchTerms.forEach((term) => {
    const variations = getTermVariations(term);
    variations.forEach((variant) => {
      if (lyrics?.includes(variant)) score += SCORE_WEIGHTS.LYRICS_MATCH;
    });
  });

  return score;
};

module.exports = {
  search,
};

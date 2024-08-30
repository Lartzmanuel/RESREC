const { google } = require('googleapis');
const axios = require('axios');
const natural = require('natural');
const cosineSimilarity = require('compute-cosine-similarity');
require('dotenv').config


YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
UDEMY_CLIENT_ID = process.env.UDEMY_CLIENT_ID;
UDEMY_CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;
GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
API_URL = process.env.API_URL;

//Getting the udemy courses
async function getRecUdemyCourse(user) {
  function extractFeatures(course) {
    const text = `${course.title} ${course.headline}`;
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
  
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens);
  
    const featureVector = [];
    tfidf.listTerms(0).forEach(term => {
      featureVector.push(term.tfidf);
    });
  
    return { vector: featureVector };
  }
  
  function normalizeVectors(vector1, vector2) {
    const maxLength = Math.max(vector1.length, vector2.length);
    const paddedVector1 = [...vector1, ...Array(maxLength - vector1.length).fill(0)];
    const paddedVector2 = [...vector2, ...Array(maxLength - vector2.length).fill(0)];
  
    return [paddedVector1, paddedVector2];
  }

  function extractFeaturesFromUser(user) {
    let combinedText = '';

    // Get the latest three search history topics
    const latestSearches = user.searchHistory.slice(-3);

    // Combine the text from the latest searches
    latestSearches.forEach(search => {
      combinedText += ` ${search}`;
    });
  
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(combinedText.toLowerCase());
  
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens);
  
    const featureVector = [];
    tfidf.listTerms(0).forEach(term => {
      featureVector.push(term.tfidf);
    });
  
    return { vector: featureVector.length > 0 ? featureVector : [0] };
  }

  try {
    const credentials = `${UDEMY_CLIENT_ID}:${UDEMY_CLIENT_SECRET}`;
    const buffer = Buffer.from(credentials, 'utf-8');
    const base64Credentials = buffer.toString('base64');
    const url = `https://www.udemy.com/api-2.0/courses/?fields[course]=title,headline,avg_rating,image_240x135,url,visible_instructors,num_reviews,price`;
    const headers = {
      Authorization: `Basic ${base64Credentials}`,
      'Content-Type': 'application/json'
    };

    const userCourseFeatures = extractFeaturesFromUser(user);

    const recommendedCourses = [];    
    const courseIds = new Set();


    for (let search of user.searchHistory.slice(-3)) {
      const params = {
        search: search,
        page: 1,
        page_size: 100,
      };

      const response = await axios.get(url, { headers, params });

      if (response.status === 200) {
        const data = response.data.results;

        // Filter out courses the user has already accessed
        const filteredCourses = data.filter(course => {
          return course.num_reviews > 5000 &&
                 !user.resourceHistory.some(resource => resource.id === course.id);
        });

        // Apply content-based filtering
        filteredCourses.forEach(course => {
          const courseFeatures = extractFeatures(course);
          const normalizedVectors = normalizeVectors(userCourseFeatures.vector, courseFeatures.vector);
          const similarity = cosineSimilarity(normalizedVectors[0], normalizedVectors[1]);

          // Check for duplicates
          if (!courseIds.has(course.id)) {
            recommendedCourses.push({
              ...course,
              similarity,
            });
            courseIds.add(course.id);
          }
        });
      }
    }

    // Sort by similarity and rating
    const sortedCourses = recommendedCourses.sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      } else {
        return b.avg_rating - a.avg_rating;
      }
    });

    const courseData = sortedCourses.slice(0, 8).map(course => ({
      Id: course.id,
      Title: course.title,
      Description: course.headline,
      CoursePicture: course.image_240x135,
      Author: course.visible_instructors[0]?.title || 'Unknown',
      Rating: course.avg_rating,
      Price: course.price || 'Free',
      CourseLink: `https://www.udemy.com${course.url}`,
    }));

    return courseData;
  } catch (error) {
    console.error(`Error fetching Udemy courses: ${error}`);
    return null;
  }
}


async function getUdemyCourse (topic) {
  try {
    const credentials = `${UDEMY_CLIENT_ID}:${UDEMY_CLIENT_SECRET}`;
    const buffer = Buffer.from(credentials, 'utf-8')
    const base64Credentials = buffer.toString('base64')
   console.log(base64Credentials);
    const url = `https://www.udemy.com/api-2.0/courses/?fields[course]=title,headline,avg_rating,image_240x135,url,visible_instructors,num_reviews,price`;
    const headers = {  
      accept: "application/json",
      Authorization: `Basic ${base64Credentials}`,
      'Content-Type': 'application/json'
    };
    const params = {
      search: topic,
      page:1,
      page_size: 100,
    };

    const response = await axios.get(url, { headers, params });

    if (response.status === 200) {
      const data = response.data.results;
      //get only the courses with reviews above 1000
      const filteredCourses = data.filter(course => {
        return course.num_reviews > 1000;
      });
      //sort the courses based on their ratings in descending order 
      const sortedCourses = filteredCourses.sort((a, b) => {
        return b.avg_rating - a.avg_rating;
      });
      console.log(sortedCourses);
      const courseData = [];

      console.log('----- Udemy Courses -----');
      sortedCourses.slice(0, 8).forEach((course) => {
        const id = course.id;
        const title = course.title;
        const description = course.headline;
        const coursePicture = course.image_240x135;
        const courseRating = course.avg_rating;
        const author = course.visible_instructors[0].title;
        const courseLink = "https://www.udemy.com"+course.url;
        
        let price = course.price;

        if (!price || price === "") {
          price = "Free";
        }

        courseData.push({
          Id: id,
          Title: title,
          Description: description,
          CoursePicture: coursePicture,
          Author: author,
          Rating: courseRating,
          Price: price,
          CourseLink: courseLink,
        });
        console.log(`Title: ${title}`);
        console.log(`Id: ${id}`);
        console.log(`Description: ${description}`);
        console.log(coursePicture);
        console.log(`Author: ${author}`);
        console.log(`Price: ${price}`);
        console.log(`CourseLink: ${courseLink}`);
        console.log(`CourseRating: ${courseRating}`);
        console.log('-------------------------------------------');
      });
     //console.log(courseData);
      return courseData;
    } else {
      console.error(`API request failed: ${response.status}`);      
    }
  } catch (error) {
    console.error(`Error fetching Udemy courses: ${error}`);
  }
};

function parseDuration(duration) {
  // Use regular expressions to extract hours, minutes, and seconds from the duration string
  const hours = duration.match(/(\d+)H/);
  const minutes = duration.match(/(\d+)M/);
  const seconds = duration.match(/(\d+)S/);

  // Convert the extracted values to integers (if available) or default to 0
  let h = hours ? parseInt(hours[1], 10) : 0;
  let m = minutes ? parseInt(minutes[1], 10) : 0;
  let s = seconds ? parseInt(seconds[1], 10) : 0;

  // Return the duration in hours, minutes, and seconds format
  return `${h}h ${m}m ${s}s`;
}

function truncateDescription(description, maxLength = 200) {
  if (description.length <= maxLength) {
      return description;
  }
  return description.slice(0, maxLength) + '...';
}

// Getting youtube videos 
async function getYoutubeVideo (topic){
  // const apiServiceName = 'youtube';
const apiVersion = 'v3';
const apiKey =  YOUTUBE_API_KEY;

const youtube = google.youtube({
  version: apiVersion,
  auth: apiKey,
});


  const searchResponse = await youtube.search.list({
    part: 'snippet',
    q: `${topic} tutorial`,
    type: 'video',
    maxResults: 10,
  });

  const videoIds = searchResponse.data.items.map((item) => item.id.videoId);

  const videosResponse = await youtube.videos.list({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
  });

 const videos = videosResponse.data.items;
 const filteredVideos = videos.filter(course => {
  return course.statistics.viewCount > 100000;
});
const sortedVideos = filteredVideos.sort((a, b) => b.statistics.viewCount - a.statistics.viewCount);
const youtubeData = [];
  console.log('----- YouTube Videos -----');
  sortedVideos.forEach((video) => {
    const title = video.snippet.title;
    const rating = video.statistics.likeCount;
    const views = video.statistics.viewCount;
    const picture = video.snippet.thumbnails.high.url;
    const videoLink = `https://www.youtube.com/watch?v=${video.id}`
   const description = truncateDescription(video.snippet.description);
    const duration = parseDuration(video.contentDetails.duration);
    const author = video.snippet.channelTitle;

    youtubeData.push({
      Title: title,
      Rating: rating,
      Views: views,
      Duration: duration,
      VideoLink: videoLink,
      Description: description,
      Picture: picture,
      Author: author,
     // CourseLink: courseLink,
    });
  });
  console.log(youtubeData);
return youtubeData;
}


//getting GoogleBooks
async function getGoogleBooks(topic) {
  const recommendations = [];

const params = {
  q: topic,
  key: GOOGLE_API_KEY,
};

const response = await axios.get(API_URL, { params });

const data = response.data;

const sortedBooks = data.items.sort((a, b) => {
  return b.volumeInfo.averageRating - a.volumeInfo.averageRating;
});
console.log(data);

console.log('----- GOOGLE BOOKS -----');
  sortedBooks.forEach((item) => {
    const volumeInfo = item.volumeInfo;
    const title = volumeInfo.title || "Unknown Title";
    const authors = volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author";
    const rating = volumeInfo.averageRating || 0 ;
    const releaseDate = volumeInfo.publishedDate || "Unknown Date";
    const bookCover = volumeInfo.imageLinks ? volumeInfo.imageLinks.smallThumbnail : "No Cover";
    const description = volumeInfo.description || "No Description";
    const link = volumeInfo.infoLink || "No Link";
    recommendations.push({
     Title: title,
     Author: authors,
     Rating: rating,
     ReleaseDate: releaseDate,
     BookCover: bookCover,
     Description: description,
     Link: link,
    });

  });
return recommendations;
}


module.exports = {
    getRecUdemyCourse,
    getUdemyCourse,
    getYoutubeVideo,
    getGoogleBooks
  };
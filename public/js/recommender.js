const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config


YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
UDEMY_CLIENT_ID = process.env.UDEMY_CLIENT_ID;
UDEMY_CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;
GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
API_URL = process.env.API_URL;

async function getUdemyCourse (topic) {
  try {
    const credentials = `${UDEMY_CLIENT_ID}:${UDEMY_CLIENT_SECRET}`;
    const buffer = Buffer.from(credentials, 'utf-8')
    const base64Credentials = buffer.toString('base64')
    // console.log(base64Credentials);
    const url = `https://www.udemy.com/api-2.0/courses/`;
    const headers = {  
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
      const data = response.data;
      console.log(data);
      const courseData = [];

      console.log('----- Udemy Courses -----');
      data.results.slice(0, 16).forEach((course) => {
        const title = course.title;
        const description = course.headline;
        const coursePicture = course.image_240x135;
        const author = course.visible_instructors[0].title;
        const courseLink = "https://www.udemy.com"+course.url;
        
        let price = course.price;

        if (!price || price === "") {
          price = "Free";
        }

        courseData.push({
          Title: title,
          Description: description,
          CoursePicture: coursePicture,
          Author: author,
          Price: price,
          CourseLink: courseLink,
        });
        console.log(`Title: ${title}`);
        console.log(`Description: ${description}`);
        console.log(coursePicture);
        console.log(`Author: ${author}`);
        console.log(`Price: ${price}`);
        console.log(`CourseLink: ${courseLink}`);
        console.log('-------------------------------------------');
      });
     //console.log(courseData);
      return courseData;
    } else {
      console.error(`API request failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching Udemy courses: ${error}`);
    return null;
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
  const sortedVideos = videos.sort((a, b) => b.statistics.likeCount - a.statistics.likeCount);
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

    console.log(`Title: ${title}`);
    console.log(`Rating: ${rating}`);
    console.log(`Views: ${views}`);
    console.log(`Picture: ${picture}`);
    console.log(`Duration: ${duration}`);
    console.log(`Description: ${description}`);
    console.log(`Author: ${author}`);
    console.log('-------------------------------------------');
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

console.log('----- GOOGLE BOOKS -----');
  data.items.forEach((item) => {
    const volumeInfo = item.volumeInfo;
    const title = volumeInfo.title || "Unknown Title";
    const authors = volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author";
    const releaseDate = volumeInfo.publishedDate || "Unknown Date";
    const bookCover = volumeInfo.imageLinks ? volumeInfo.imageLinks.smallThumbnail : "No Cover";
    const description = volumeInfo.description || "No Description";
    const link = volumeInfo.infoLink || "No Link";
    recommendations.push({
     Title: title,
     Author: authors,
     ReleaseDate: releaseDate,
     BookCover: bookCover,
     Description: description,
     Link: link,
    });
    console.log(`Title: ${title}`);
        console.log(`Release Date: ${releaseDate}`);
        console.log(bookCover);
        console.log(`Author: ${authors}`);
        console.log('-------------------------------------------');

  });
return recommendations;
}


module.exports = {
    getUdemyCourse,
    getYoutubeVideo,
    getGoogleBooks
  };
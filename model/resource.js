const mongoose = require('mongoose')

const resSchema = new mongoose.Schema({
   courseId: {
    type: Number,
    required: true,
    unique: true
  },  
  
  title: {
        type: String,
        required: true
      },
      image: {
        type: String,  // URL to the image
        required: true
      }, 
      link: {
        type: String,  // URL to the course
        required: true
      },
      description: {
        type: String,
        required: true
    },
    clickedAt: {
        type: Date,
        default: Date.now
      }
      
})

const Resource = mongoose.model('Resource', resSchema)
module.exports = Resource;
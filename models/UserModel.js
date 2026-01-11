const { default: mongoose } = require("mongoose");


const UserSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    role :{type: String,default: 'user'},
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
})
const UserModels= mongoose.models.User ||mongoose.model("User",UserSchema)
export default UserModels;
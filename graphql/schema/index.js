const { buildSchema } = require('graphql');

module.exports = buildSchema(`
        scalar Upload
    
        type UserPrivateInfo {
            email: String
            telephone: String
            passwd: String
        }
        
        input UserPrivateInfoInput{
            email: String
            telephone: String
            passwd: String
        }

        type User {
            _id: ID!
            username: String!
            name: String!
            following: [String]
            followers:[String]
            posts:[String]
            likes:[String]
            image: Boolean!
            privateInfo: UserPrivateInfo!
            imgUrl: String
        }

        type UserToReaded {
            username: String!
            name: String!
            following: [String]!
            followers:[String]!
        }

        type Urls {
            imgUrl: String!
            bckUrl: String!
        }
        
        type UserRetun{
            user: User!
            urls: Urls!
        }

        input UserInput {
            username: String!
            name: String!
            privateInfo: UserPrivateInfoInput!
        }


        type AuthData {
            userId: ID!
            token: String!
            tokenExpiration: Int!
            refresh_token: String!
            refresh_tokenExpiration: Int!
        }

        input ImageDataInput {
            base64:String!
            type: String!
        }

        input ImageInfoInput{
            url: String!
            author: String!
            bck: String!
        }
        type ImageInfo{
            url: String!
            author: String!
            bck: String!
        }

        type Like{
            postID: String!
            username:String!
            name:String!
            image: Boolean!
            likedOn: String!
        }


        input PostInput{
            title: String!
            content:[String]!
            authorId:String!
            imageInfo: ImageInfoInput
        }

        type Post{
            _id: ID!
            title: String!
            content: [String]!
            authorId:String!
            imageInfo: ImageInfo
            likes: Int
            createdOn: String!
            img: String
        }
    
        type RootMutation {
            createUser(user: UserInput, enteredCode: String!): User
            
            createVerficationCode(email: String!): String 
            createVerficationCodeChangePasswd(email: String!): String 
            
            updateProfileName(username: String!, name: String!): String
            updateUserPrivateProfile(username: String!, email: String!, telephone: String!): String
            updateProfileImage(img: ImageDataInput!, username: String!): String
            updatePasswd(username: String!, oldPasswd:String!, newPasswd: String!): String
            changePasswd(email:String!, newPasswd:String!, enteredCode: String!): String

            createPost(username: String!, post:PostInput!): String
            removePost(username: String!, postID: String!):String
            giveLike(likerUsername: String!, postID: String!, give: Boolean!): String

            follow(username: String,followedUsername: String!): String

            logOut(username: String!, userID: String!): String
            removeAccount(username: String!, userID: String!, roomID: String!): String
            suggestion(username: String, suggestion:String) : String
        }
        
        type RootQuery {
            user(username: String): UserRetun
          
            login(username: String!, passwd: String!): AuthData

            getPostProfile(username: String!, target: String!, lastReaded: String!): [Post]
            getAllPostMyProfile(username: String!): [Post]
            getPostFollowers(username: String!, lastReaded: String!, isForMe: Boolean!):[Post]
            getPostsOfUser(username: String!, userOf: String!, lastReaded: String!):[Post]
            getUserInfo(username: String, userOf:String): UserToReaded

            searchUsers(username: String!, searchTerm: String!): [User]
            refreshToken(userID:String!,username:String!, token: String!, refresh: String!): AuthData
           
            verifyCode(email: String!, token: String!): String 
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `)
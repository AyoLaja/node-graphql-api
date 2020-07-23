// DEFINING QUERIES, ACTION AND MUTATIONS

const { buildSchema } = require("graphql");

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type Posts {
    posts: [Post!]!
    totalItems: Int!
  }

  type User {
    _id: ID!,
    name: String!
    email: String!
    password: String!
    status: String!
    posts: [Post!]!
  }

  input UserInputData {
    name: String!
    email: String!
    password: String!
  }

  input PostInputData {
    title: String!
    content: String!
    imageUrl: String!
  }

  type authData {
    token: String!
    userId: String!
  }

  type RootQuery {
    login(email: String!, password: String!): authData!
    getPosts(page: Int!): Posts!
    getPost(postId: ID!): Post!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
    updatePost(postId: ID!, postInput: PostInputData): Post!
    deletePost(postId: ID!): Boolean
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

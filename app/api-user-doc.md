# USER API Documentation

## **Update User**

1. **URL:** `/api/user/update`

1. **Method:** `POST`

* **Description:** Updates user information based on the provided username.

* **Headers:**

  * `Content-Type: application/json`
  * `Cookie: token=YOUR_JWT_TOKEN`

* **Request Body:**

* *filter* : represents the field used to identify the user you want to update. 

  ```json
  {
    "filter": { "username": "salam" },
    "data": {
      "username": "otman",
      "email": "otman@otman",
      "bio": "machi 3alam"
    }
  }
  ```

---

## **GraphQL like Query for Users**

* **URL:** `/api/user/graphql`

* **Method:** `POST`

* **Description:** Fetches specific users fields using a GraphQL-like query.

* **Headers:**

  * `Content-Type: application/json`
  * `Cookie: token=YOUR_JWT_TOKEN`

* **Request Body:**

* *fields* : the fields you want to fetch from users

  ```json
  {
    "fields": ["username", "avatar"]
  }
  ```

---

## **Filter User**

* **URL:** `/api/user/filter`

* **Method:** `POST`

* **Description:** Filters users based on specific criteria and retrieves selected fields.

* **Headers:**

  * `Content-Type: application/json`
  * `Cookie: token=YOUR_JWT_TOKEN`

* **Request Body:** 
- *filter* : to fetch a unique user identified by the filter object. 
**NB** : you can filter using the following fields: {"email" : "otman@exemple.com"}
- *fields* : the required fields to fetch from a user.

  ```json
  {
    "filter": {"username": "otman"},
    "fields": ["username", "avatar"]
  }
  ```

---

## **Get All Users**

* **URL:** `/api/user`
* **Method:** `GET`
* **Description:** Retrieves the list of all registered users with all fields **!not recommanded**.
* **Headers:**

  * `Cookie: token=YOUR_JWT_TOKEN`

---

## **Delete User**

* **URL:** `/api/user/alli`
* **Method:** `DELETE`
* **Description:** Deletes the specified user by username (`alli` in this example).
* **Headers:**

  * `Cookie: token=YOUR_JWT_TOKEN`

---

# **NB :**

* All requests require a valid JWT token in the `Cookie` header.
* `Content-Type` should be set to `application/json` for POST requests.
* GraphQL queries allow for flexible field selection.

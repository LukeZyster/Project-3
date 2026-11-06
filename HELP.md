# Read Me First
The following was discovered as part of building this project:

* The original package name 'com.student-marketplace.app' is invalid and this project uses 'com.student_marketplace.app' instead.

# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.1.1/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.1.1/maven-plugin/build-image.html)
* [Validation](https://docs.spring.io/spring-boot/4.1.1/reference/io/validation.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.1.1/reference/web/servlet.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.1.1/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Spring Security](https://docs.spring.io/spring-boot/4.1.1/reference/web/spring-security.html)
* [WebSocket](https://docs.spring.io/spring-boot/4.1.1/reference/messaging/websockets.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Validation](https://spring.io/guides/gs/validating-form-input/)
* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing data with MySQL](https://spring.io/guides/gs/accessing-data-mysql/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)

### Accounts and admin access

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as backend environment secrets to create the initial administrator account. Use a valid email address and a unique password with at least 8 characters and no more than 72 UTF-8 bytes. The password is stored as a BCrypt hash; the configured admin password is reapplied when the backend starts. Do not commit the password or share it in chat.

People can create regular accounts through the registration page. After signing in, the administrator can promote or demote users from the Account page. The backend checks the signed-in session and always keeps at least one administrator account.

The production frontend and API are hosted on separate sites, so keep `SESSION_COOKIE_SAME_SITE=none` and `SESSION_COOKIE_SECURE=true` for production. For local HTTP development, set `SESSION_COOKIE_SAME_SITE=lax` and `SESSION_COOKIE_SECURE=false`.

Use a persistent database for production account storage. Without an external database configuration, Spring Boot uses the development H2 database, which may not retain users across restarts.
* [Using WebSocket to build an interactive web application](https://spring.io/guides/gs/messaging-stomp-websocket/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.


package com.student_marketplace.app.domain;

public class Profile {

    private Long id;

    private String name;

    private String course;

    private String year;

    private String studentId;

    private String university;

    private String faculty;

    private String about;

    private int coursesEnrolled;

    private int assignments;

    private int averageGrade;

    private int unreadNotifications;


    // Default constructor
    public Profile() {
    }


    // Constructor
    public Profile(
            Long id,
            String name,
            String course,
            String year,
            String studentId,
            String university,
            String faculty,
            String about,
            int coursesEnrolled,
            int assignments,
            int averageGrade,
            int unreadNotifications
    ) {

        this.id = id;
        this.name = name;
        this.course = course;
        this.year = year;
        this.studentId = studentId;
        this.university = university;
        this.faculty = faculty;
        this.about = about;
        this.coursesEnrolled = coursesEnrolled;
        this.assignments = assignments;
        this.averageGrade = averageGrade;
        this.unreadNotifications = unreadNotifications;
    }


    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }


    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }


    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }


    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }


    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }


    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }


    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }


    public int getCoursesEnrolled() {
        return coursesEnrolled;
    }

    public void setCoursesEnrolled(int coursesEnrolled) {
        this.coursesEnrolled = coursesEnrolled;
    }


    public int getAssignments() {
        return assignments;
    }

    public void setAssignments(int assignments) {
        this.assignments = assignments;
    }


    public int getAverageGrade() {
        return averageGrade;
    }

    public void setAverageGrade(int averageGrade) {
        this.averageGrade = averageGrade;
    }


    public int getUnreadNotifications() {
        return unreadNotifications;
    }

    public void setUnreadNotifications(int unreadNotifications) {
        this.unreadNotifications = unreadNotifications;
    }
}
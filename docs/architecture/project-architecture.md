# TeioOS Domain Model Architecture

This document describes the core domain model hierarchy for the TeioOS Exam Server.

## Entity Hierarchy

```text
Department
├── Class
│   └── Student
└── Subject
    └── Exam
        ├── Question
        ├── Option
        └── ExamSchedule
```

## Description

- **Department**: The top-level administrative grouping (e.g., Computer Science, Mechanical Engineering).
- **Class**: Represents a batch or semester grouping of students within a department.
- **Student**: The individual taking examinations, enrolled in a specific class.
- **Subject**: A specific academic course or curriculum (e.g., Database Management Systems, Data Structures) that belongs to a department. 
- **Exam**: An assessment assigned to a specific subject. Cannot exist without a subject.
- **Question & Option**: The individual components that make up an Exam.
- **ExamSchedule**: The specific time slot and status for an Exam, mapping it to students taking the exam.

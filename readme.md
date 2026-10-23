Review my `/run/media/abumahid/Projects/My Project/submitFlow/server/prisma/schema/project.prisma`.
Now i need :
    - post (STUDENT) : Submit new project
    - patch (STUDENT) : update project info when status PENDING , after IN_PROGRESS |  REJECTED | APPROVED student can't update any info.
    - put (MENTOR) : update project status and reviewerFeedBack
    - get (STUDENT) : only own project with searchTerm(name), status(filter) and pagination
    - get (MENTOR) : all student project with same searchTerm, status, sort by createdAt, and studentId filtering.

Note: Don't touch any un-related files. Implement it directly.
Bootstrap, FontAwesome, NodeJS and an XAMPP Server and Database are required for this wiki engine to run.

TEST WIKI 4 (actually NeoWiki dev version Alpha 2) ROADMAP!!!


1. Restore Deleted Pages or Select Revisions of a Deleted Page

    Modular Approach: Implement a restoration module that can handle both the restoration of entire pages and individual revisions. This module could interface with both the deletion logic and a historical archive of deleted pages and revisions.

2. Logic to Flush Deleted Revisions and Pages

    Scheduled Tasks: Implement this as a background service that periodically checks for deletions that meet certain criteria (e.g., age, relevance) and purges them from the system. Ensure that this service can be configured or disabled as needed.

3. Content Templates

    Template Engine: Develop a separate module for managing content templates. This should allow users to create, modify, and apply templates easily. Consider the use of placeholders and dynamic content within templates.

4. Bootstrap Cards

    UI Component Library: Treat Bootstrap Cards as part of a larger library of UI components available for use within the wiki. This library could be managed independently, allowing for the addition of new components over time.

5. Finish the Normal Editor

    Editor Module: Focus on making the editor module extensible, allowing for the easy addition of new buttons and features. Consider the integration with the content templates module for inserting predefined templates.

6. Finish Google Login Logic

    Authentication Module: The Google login should be part of a broader authentication module that could be extended to support other OAuth providers in the future. Ensure that this module handles user sessions securely.

7. Account Disable Logic

    User Management Module: Implement account disable logic within a user management module that handles various user-related functionalities, including account creation, modification, and deletion.

8. WYSIWYG Editor

    Rich Text Editor Module: The WYSIWYG editor should be a standalone module that can be integrated into the normal editor. It should allow for seamless switching between WYSIWYG and markdown modes.

For each of these modules, consider how they interact with existing parts of the system and how they can be designed to be as independent as possible. This will aid in maintaining the simplicity and modularity of your application, making it easier to manage, extend, and improve over time, much like Slackware's approach to package management and system design.

Designing Linkiowikis with a focus on performance and adopting programming principles similar to those of Slackware—a distro known for its simplicity, stability, and minimalism—requires a careful approach. Here are some guidelines and suggestions to keep in mind as you implement the new features:
1. Efficiency and Performance:

    Optimize Database Interactions: Use efficient queries and indexes. Consider caching the results of queries that are read frequently but updated less often.
    Lazy Loading: Implement lazy loading for resources and components that are not immediately necessary to render a page. This can improve load times significantly.
    Minimize External Dependencies: Just as Slackware selects packages carefully, minimize the use of heavy libraries or frameworks unless absolutely necessary. Consider lightweight alternatives.

2. Simplicity in Design and Architecture:

    Modular Design: Design features in a modular way, allowing them to be easily enabled, disabled, or replaced. This approach aligns with Slackware’s philosophy of simplicity and full control.
    Clear Documentation: Maintain clear and concise documentation for your codebase and architecture, making it easy for others to understand, contribute, or modify the system.
    User Interface Simplicity: Ensure that the user interface remains intuitive and uncluttered, even as you add new features. Prioritize ease of use and accessibility.

3. Stability and Reliability:

    Thorough Testing: Implement comprehensive testing, including unit tests, integration tests, and performance tests, to ensure new features do not introduce regressions or performance issues.
    Rollback Mechanisms: Design features with the ability to rollback changes or recover from errors gracefully. This is crucial for maintaining the stability of the system.
    Performance Monitoring: Continuously monitor the performance of your wiki, identifying and addressing any bottlenecks or scalability issues.

4. Adherence to Core Principles:

    Configuration over Convention: Similar to Slackware, allow for extensive configuration and customization by the administrators, offering control over how features work and are presented.
    Security: Prioritize security in every aspect of the system, from authentication and authorization to data storage and communication. Implement features with security in mind from the ground up.

5. Community and Contribution:

    Encourage Contributions: Just as Slackware benefits from its community, design your system in a way that encourages contributions from others, whether through plugins, templates, or direct code contributions.
    Feedback Loops: Establish channels for user feedback and contributions, integrating valuable insights into the development process.

Enhancements or additional features:

*User Permissions and Roles: Implementing a system to manage user roles (e.g., admin, editor, viewer) and permissions can provide finer control over who can edit, delete, or move pages.

*Page Discussion or Comments: Adding a discussion or comments section on each page can facilitate community engagement and feedback.

*Search Functionality: Implementing a search feature to help users find pages or content more efficiently.

*Content Tagging and Categorization: Enhancing the categorization system to include tagging can improve the organization and discoverability of content.

*Content Versioning and Rollback: While you have a history and revisions feature, ensuring that users can easily revert to a previous version can be valuable.

*Content Templates: Providing templates for common page types or content formats can streamline content creation.

*Internationalization and Localization: If your user base is international, supporting multiple languages can enhance accessibility.

*Accessibility Enhancements: Ensuring your wiki is accessible to users with disabilities by following web accessibility guidelines.

*API for External Integration: Creating an API for your wiki can allow external applications to interact with your content programmatically.

*Mobile Optimization: Ensuring that your wiki is fully responsive and mobile-friendly can improve the user experience on mobile devices.

*Security Enhancements: Continuously reviewing and enhancing the security of your application, including protection against common web vulnerabilities.


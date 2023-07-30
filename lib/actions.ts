import { ProjectForm } from "@/common.types";
import { 
    createProjectMutation, 
    createUserMutation, 
    deleteProjectMutation, 
    getProjectByIdQuery, 
    getProjectsOfUserQuery, 
    getUserQuery, 
    projectsQuery, 
    updateProjectMutation,
    fetcjAllProjects
} from "@/graphql";
import { GraphQLClient } from "graphql-request";

const isProduction = process.env.NODE_ENV === "production";
const apiUrl = 'https://clone-graf-main-kgithub-yandexru.grafbase.app/graphql';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTA3NDQ1NDUsImlzcyI6ImdyYWZiYXNlIiwiYXVkIjoiMDFINk0zTVI2MEtBS0ZXUVhBUzFYSk44OVAiLCJqdGkiOiIwMUg2TTNNUkM4UzI3UU4zRjlEV04wNjQ2RyIsImVudiI6InByb2R1Y3Rpb24iLCJwdXJwb3NlIjoicHJvamVjdC1hcGkta2V5In0.HTi38PM34tgeQ--ESd3SI8GAsnT4nYbMAl8TXIStU1M';
const serverUrl = isProduction ? process.env.NEXTAUTH_URL || "https://my-test-app-z9ls.onrender.com" : "http://localhost:3000";

const client = new GraphQLClient(apiUrl);

const makeGraphQLRequest = async (query: string, variables = {}) => {
    try {
        return await client.request(query, variables);
    } catch (error) {
        console.log(error);
        ;
    }
}

export const getUser = (email: string) => {
    client.setHeader('x-api-key', apiKey);
    return makeGraphQLRequest(getUserQuery, { email });
}

export const createUser = (name: string, email: string, avatarUrl: string) => {
    client.setHeader('x-api-key', apiKey);
    const variables = {
        input: {
            name, email, avatarUrl
        }
    }
    return makeGraphQLRequest(createUserMutation, variables);
}

export const fetchToken = async () => {
    try {
        console.log(serverUrl, ' -serverurl');
        const response = await fetch(`${serverUrl}/api/auth/token`);
        return response.json();
    } catch (error) {
        throw error;
    }
}

export const uploadImage = async (imagePath: string) => {
    try {
        const response = await fetch(`${serverUrl}/api/upload`, {
            method: 'POST',
            body: JSON.stringify({ path: imagePath })
        });

        return response.json();
    } catch (error) {
        throw error;
    }
}

export const createNewProject = async (form: ProjectForm, creatorId: string, token: string) => {
    const imageUrl = await uploadImage(form.image);

    if(imageUrl.url) {
        client.setHeader('Authorization', `Bearer ${token}`);

        const variables = {
            input: {
                ...form,
                image: imageUrl.url,
                createdBy: {
                    link: creatorId
                }
            }
        }

        return makeGraphQLRequest(createProjectMutation, variables);
    }
}

export const fetchAllProjects = async (category?: string, endcursor?: string) => {
    client.setHeader('x-api-key', apiKey);
    return makeGraphQLRequest(projectsQuery, { category, endcursor });
}

export const fetchAllProjectsWithoutCategory = async () => {
    client.setHeader('x-api-key', apiKey);
    return makeGraphQLRequest(fetcjAllProjects);
}

export const getProjectDetails = async (id: string) => {
    client.setHeader('x-api-key', apiKey);
    return makeGraphQLRequest(getProjectByIdQuery, { id });
}

export const getUserProjects = async (id: string, last?: number) => {
    client.setHeader('x-api-key', apiKey);
    return makeGraphQLRequest(getProjectsOfUserQuery, { id, last });
}

export const deleteProject = async (id: string, token: string) => {
    client.setHeader('Authorization', `Bearer ${token}`);
    return makeGraphQLRequest(deleteProjectMutation, { id });
}

export const updateProject = async (form: ProjectForm, projectId: string, token: string) => {
    function isBase64DataURL(value: string) {
        const base64Regex = /^data:image\/[a-z]+;base64,/;
        return base64Regex.test(value);
    }
    
    let updatedForm = { ...form };
    
    const isUploadingNewImage = isBase64DataURL(form.image);

    if(isUploadingNewImage) {
        const imageUrl = await uploadImage(form.image);

        if(imageUrl.url) {
            updatedForm = {
                ...form,
                image: imageUrl.url
            }
        }
    }

    const variables = {
        id: projectId,
        input: updatedForm
    }
    
    client.setHeader('Authorization', `Bearer ${token}`);
    return makeGraphQLRequest(updateProjectMutation, variables);
}
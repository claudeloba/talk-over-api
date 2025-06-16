
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type UpdateProjectStatus, type CreateVideoRequest } from '../schema';
import { updateProjectStatus } from '../handlers/update_project_status';
import { eq } from 'drizzle-orm';

// Test inputs
const testProjectInput: CreateVideoRequest = {
  topic: 'Test Video Project',
  duration_preference: 'short',
  voice_preference: 'test-voice-id',
  visual_style: 'mixed'
};

const testUpdateInput: UpdateProjectStatus = {
  id: 1,
  status: 'script_generation'
};

describe('updateProjectStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update project status', async () => {
    // Create a test project first
    const createdProject = await db.insert(videoProjectsTable)
      .values({
        topic: testProjectInput.topic,
        duration_preference: testProjectInput.duration_preference,
        voice_preference: testProjectInput.voice_preference,
        visual_style: testProjectInput.visual_style,
        status: 'pending'
      })
      .returning()
      .execute();

    const projectId = createdProject[0].id;

    // Update the project status
    const result = await updateProjectStatus({
      id: projectId,
      status: 'script_generation'
    });

    // Verify the update
    expect(result.id).toEqual(projectId);
    expect(result.status).toEqual('script_generation');
    expect(result.topic).toEqual('Test Video Project');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update project status with error message', async () => {
    // Create a test project first
    const createdProject = await db.insert(videoProjectsTable)
      .values({
        topic: testProjectInput.topic,
        status: 'pending'
      })
      .returning()
      .execute();

    const projectId = createdProject[0].id;

    // Update the project status with error message
    const result = await updateProjectStatus({
      id: projectId,
      status: 'failed',
      error_message: 'Script generation failed'
    });

    // Verify the update
    expect(result.id).toEqual(projectId);
    expect(result.status).toEqual('failed');
    expect(result.error_message).toEqual('Script generation failed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    // Create a test project first
    const createdProject = await db.insert(videoProjectsTable)
      .values({
        topic: testProjectInput.topic,
        status: 'pending'
      })
      .returning()
      .execute();

    const projectId = createdProject[0].id;

    // Update the project status
    await updateProjectStatus({
      id: projectId,
      status: 'completed'
    });

    // Query the database to verify the update
    const projects = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].status).toEqual('completed');
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent project', async () => {
    const nonExistentId = 9999;

    await expect(updateProjectStatus({
      id: nonExistentId,
      status: 'completed'
    })).rejects.toThrow(/not found/i);
  });

  it('should update multiple status fields correctly', async () => {
    // Create a test project first
    const createdProject = await db.insert(videoProjectsTable)
      .values({
        topic: testProjectInput.topic,
        status: 'pending',
        error_message: null
      })
      .returning()
      .execute();

    const projectId = createdProject[0].id;

    // Update status to failed with error message
    const failedResult = await updateProjectStatus({
      id: projectId,
      status: 'failed',
      error_message: 'Processing error occurred'
    });

    expect(failedResult.status).toEqual('failed');
    expect(failedResult.error_message).toEqual('Processing error occurred');

    // Update status to completed (clearing error message)
    const completedResult = await updateProjectStatus({
      id: projectId,
      status: 'completed',
      error_message: null
    });

    expect(completedResult.status).toEqual('completed');
    expect(completedResult.error_message).toBeNull();
  });
});

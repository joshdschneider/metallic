import express from 'express';
import { listInvitations, revokeInvitation, sendInvitation } from '../controllers/invitation.controller.js';
import {
  createOrganization,
  listOrganizationMembers,
  listOrganizations,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMember
} from '../controllers/organization.controller.js';
import { createProject, deleteProject, listProjects, retrieveProject } from '../controllers/project.controller.js';

const organizationRouter = express.Router();

organizationRouter.route('/').get(listOrganizations);
organizationRouter.route('/').post(createOrganization);
organizationRouter.route('/:organization_id').put(updateOrganization);
organizationRouter.route('/:organization_id/projects').get(listProjects);
organizationRouter.route('/:organization_id/projects').post(createProject);
organizationRouter.route('/:organization_id/projects/:project_id').get(retrieveProject);
organizationRouter.route('/:organization_id/projects/:project_id').delete(deleteProject);
organizationRouter.route('/:organization_id/members').get(listOrganizationMembers);
organizationRouter.route('/:organization_id/members/:membership_id').put(updateOrganizationMember);
organizationRouter.route('/:organization_id/members/:membership_id/remove').post(removeOrganizationMember);
organizationRouter.route('/:organization_id/invitations').get(listInvitations);
organizationRouter.route('/:organization_id/invitations').post(sendInvitation);
organizationRouter.route('/:organization_id/invitations/:invitation_id/revoke').post(revokeInvitation);

export { organizationRouter };

import express from 'express';
import { listInvitations, revokeInvitation, sendInvitation } from '../controllers/invitation.controller.js';
import { listInvoices } from '../controllers/invoices.controller.js';
import {
  createOrganization,
  listOrganizationMembers,
  listOrganizations,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMember
} from '../controllers/organization.controller.js';
import {
  addPaymentMethod,
  listPaymentMethods,
  makePaymentMethodDefault,
  removePaymentMethod,
  setupPaymentMethod
} from '../controllers/payment-method.controller.js';
import {
  createProject,
  deleteProject,
  listProjects,
  retrieveProject,
  updateProject
} from '../controllers/project.controller.js';
import {
  cancelSubscription,
  createSubscription,
  downgradeSubscription,
  listSubscriptions,
  upgradeSubscription
} from '../controllers/subscription.controller.js';

const organizationRouter = express.Router();

organizationRouter.route('/').get(listOrganizations);
organizationRouter.route('/').post(createOrganization);
organizationRouter.route('/:organization_id').put(updateOrganization);

// Projects
organizationRouter.route('/:organization_id/projects').get(listProjects);
organizationRouter.route('/:organization_id/projects').post(createProject);
organizationRouter.route('/:organization_id/projects/:project_id').get(retrieveProject);
organizationRouter.route('/:organization_id/projects/:project_id').put(updateProject);
organizationRouter.route('/:organization_id/projects/:project_id').delete(deleteProject);

// Members
organizationRouter.route('/:organization_id/members').get(listOrganizationMembers);
organizationRouter.route('/:organization_id/members/:membership_id').put(updateOrganizationMember);
organizationRouter.route('/:organization_id/members/:membership_id/remove').post(removeOrganizationMember);

// Invitations
organizationRouter.route('/:organization_id/invitations').get(listInvitations);
organizationRouter.route('/:organization_id/invitations').post(sendInvitation);
organizationRouter.route('/:organization_id/invitations/:invitation_id/revoke').post(revokeInvitation);

// Subscriptions
organizationRouter.route('/:organization_id/subscriptions').get(listSubscriptions);
organizationRouter.route('/:organization_id/subscriptions').post(createSubscription);
organizationRouter.route('/:organization_id/subscriptions/upgrade').post(upgradeSubscription);
organizationRouter.route('/:organization_id/subscriptions/downgrade').post(downgradeSubscription);
organizationRouter.route('/:organization_id/subscriptions/cancel').post(cancelSubscription);

// Payment methods
organizationRouter.route('/:organization_id/payment-methods').get(listPaymentMethods);
organizationRouter.route('/:organization_id/payment-methods/setup').post(setupPaymentMethod);
organizationRouter.route('/:organization_id/payment-methods/add').post(addPaymentMethod);
organizationRouter.route('/:organization_id/payment-methods/make-default').post(makePaymentMethodDefault);
organizationRouter.route('/:organization_id/payment-methods/remove').post(removePaymentMethod);

// Invoices
organizationRouter.route('/:organization_id/invoices').get(listInvoices);

export { organizationRouter };

import * as ControlPlane from '@metallichq/control-plane';
import {
  ApiKeyService,
  DEFAULT_EMAIL_SUBSCRIPTIONS,
  DEFAULT_PROJECT_NAME,
  inferOrganizationName,
  OrganizationService,
  ProjectService,
  UserService,
  WorkOSClient
} from '@metallichq/shared';
import { OrganizationMembershipRole, OrganizationMembershipStatus } from '@metallichq/types';
import { User as WorkOSUser } from '@workos-inc/node';

export const onUserAuthenticated = async (workosUser: WorkOSUser) => {
  // Does user exist in our database?
  let user = await UserService.getUserByEmail(workosUser.email);
  if (!user) {
    user = await UserService.createUser({
      workos_user_id: workosUser.id,
      email: workosUser.email,
      email_verified: workosUser.emailVerified,
      first_name: workosUser.firstName,
      last_name: workosUser.lastName,
      profile_picture_url: workosUser.profilePictureUrl,
      email_subscriptions: DEFAULT_EMAIL_SUBSCRIPTIONS
    });
  }

  // Is user verified?
  if (!user.email_verified && workosUser.emailVerified) {
    await UserService.updateUser(user.id, {
      email_verified: workosUser.emailVerified
    });
  }

  // Is user an active member of an organization in WorkOS?
  const workosOrgMemberships = await WorkOSClient.listOrganizationMemberships({
    userId: workosUser.id
  });

  // If not, create organization
  if (workosOrgMemberships.length === 0) {
    const workosOrg = await WorkOSClient.createOrganization(inferOrganizationName(user) || 'Untitled');
    const organization = await OrganizationService.createOrganization({
      name: inferOrganizationName(user) || null,
      workos_organization_id: workosOrg.id,
      stripe_customer_id: null
    });

    const workosOrgMembership = await WorkOSClient.createOrganizationMembership({
      userId: workosUser.id,
      organizationId: workosOrg.id,
      roleSlug: OrganizationMembershipRole.Owner
    });

    await OrganizationService.createOrganizationMembership({
      organization_id: organization.id,
      user_id: user.id,
      role: workosOrgMembership.role.slug as OrganizationMembershipRole,
      status: workosOrgMembership.status as OrganizationMembershipStatus,
      workos_organization_membership_id: workosOrgMembership.id
    });

    const project = await ProjectService.createProject({
      organization_id: organization.id,
      name: DEFAULT_PROJECT_NAME
    });

    await Promise.all([
      ApiKeyService.createApiKey({ projectId: project.id, name: null }),
      ControlPlane.onProjectCreated(project.id)
    ]);
  } else {
    for (const workosOrgMembership of workosOrgMemberships) {
      // Does this organization exist in our database?
      let organization = await OrganizationService.getOrganizationByWorkosOrganizationId(
        workosOrgMembership.organizationId
      );
      if (!organization) {
        organization = await OrganizationService.createOrganization({
          name: inferOrganizationName(user) || null,
          workos_organization_id: workosOrgMembership.organizationId,
          stripe_customer_id: null
        });
      }

      // Does the organization membership exist in our database?
      const organizationMembership =
        await OrganizationService.getOrganizationMembershipByWorkosOrganizationMembershipId(workosOrgMembership.id);
      if (!organizationMembership) {
        await OrganizationService.createOrganizationMembership({
          organization_id: organization.id,
          user_id: user.id,
          role: workosOrgMembership.role.slug as OrganizationMembershipRole,
          status: workosOrgMembership.status as OrganizationMembershipStatus,
          workos_organization_membership_id: workosOrgMembership.id
        });
      }

      // Does this organization have a project?
      const projects = await ProjectService.getProjectsByOrganizationId(organization.id);
      if (projects.length === 0) {
        const project = await ProjectService.createProject({
          organization_id: organization.id,
          name: DEFAULT_PROJECT_NAME
        });

        await Promise.all([
          ApiKeyService.createApiKey({ projectId: project.id, name: null }),
          ControlPlane.onProjectCreated(project.id)
        ]);
      }
    }
  }
};

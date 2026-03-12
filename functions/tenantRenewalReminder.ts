import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active tenants
    const allTenants = await base44.asServiceRole.entities.Tenant.filter({ status: "active" }, null, 1000);
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    let notificationCount = 0;

    for (const tenant of allTenants) {
      const expiryDate = new Date(tenant.period_end_date);
      
      // Check if expires between today and 2 months
      if (expiryDate <= twoMonthsFromNow && expiryDate > today) {
        // Check if we already sent a notification for this tenant
        const existingNotif = await base44.asServiceRole.entities.Notification.filter({
          user_email: tenant.landlord_email,
          ref_id: `tenant_expiry_${tenant.id}`
        }, null, 1);

        if (existingNotif.length === 0) {
          // Create notification
          await base44.asServiceRole.entities.Notification.create({
            user_email: tenant.landlord_email,
            type: "tenant_renewal",
            title: `Tenant Agreement Expiring Soon`,
            body: `Your arrangement with ${tenant.tenant_name} at ${tenant.property_address} expires on ${expiryDate.toLocaleDateString()}. Time to arrange the next payment or relist.`,
            url: `TenantManagement?tenant_id=${tenant.id}`,
            ref_id: `tenant_expiry_${tenant.id}`,
            is_read: false
          });
          
          // Send email
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: tenant.landlord_email,
            subject: `Tenant Payment Expiring - ${tenant.tenant_name}`,
            body: `Your rental arrangement with ${tenant.tenant_name} at ${tenant.property_address} will expire on ${expiryDate.toLocaleDateString()}. 

Please log in to your OSKAN account to either:
- Log a new payment to extend the arrangement
- Relist the property on the marketplace

Reference: ${tenant.id}`
          });

          notificationCount++;
        }
      }
    }

    return Response.json({ processed: allTenants.length, notificationsSent: notificationCount });
  } catch (error) {
    console.error('Error in tenantRenewalReminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
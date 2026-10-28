import { CustomerRepository, CustomerRow } from '../repositories/customer.repository';
import { AuditService } from './audit.service';

export class CustomerService {
  private repo = new CustomerRepository();

  async getCustomers(filters: { search?: string; status?: string } = {}): Promise<CustomerRow[]> {
    return this.repo.findAll(filters);
  }

  async getCustomerById(id: number): Promise<CustomerRow> {
    const c = await this.repo.findById(id);
    if (!c) throw new Error('Customer not found');
    return c;
  }

  async createCustomer(
    data: {
      customer_code?: string;
      customer_name: string;
      contact_person?: string | null;
      contact_number?: string | null;
      email?: string | null;
      country_id?: number | null;
      state?: string | null;
      city?: string | null;
      community_id?: number | null;
      nationality_id?: number | null;
      address?: string | null;
      status?: 'active' | 'inactive';
    },
    createdBy?: number,
    ipAddress?: string
  ): Promise<CustomerRow> {
    const trimmedName = data.customer_name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Customer / Company name is required (at least 2 characters)');
    }

    // Email format validation
    if (data.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        throw new Error('Please enter a valid email address');
      }
    }

    // Auto-generate code if not supplied
    const code = data.customer_code?.trim() || (await this.repo.generateCode());

    // Uniqueness check on code
    const existing = await this.repo.findByCode(code);
    if (existing) throw new Error(`Customer code '${code}' is already in use`);

    // Email uniqueness (if provided)
    if (data.email?.trim()) {
      const byEmail = await this.repo.findByEmail(data.email.trim());
      if (byEmail) throw new Error(`A customer with email '${data.email.trim()}' already exists`);
    }

    const id = await this.repo.create({
      ...data,
      customer_name: trimmedName,
      customer_code: code,
      email: data.email?.trim() || null,
      contact_number: data.contact_number?.trim() || null,
      contact_person: data.contact_person?.trim() || null,
      created_by: createdBy || null,
    });

    await AuditService.log({
      userId: createdBy,
      action: 'CREATE',
      module: 'customers',
      description: `Customer '${trimmedName}' (${code}) created`,
      recordId: id,
      ipAddress,
    });

    return (await this.repo.findById(id))!;
  }

  async updateCustomer(
    id: number,
    data: Partial<CustomerRow>,
    updatedBy?: number,
    ipAddress?: string
  ): Promise<CustomerRow> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new Error('Customer not found');

    if (data.customer_name !== undefined) {
      const trimmedName = data.customer_name?.trim();
      if (!trimmedName || trimmedName.length < 2) {
        throw new Error('Customer / Company name must be at least 2 characters');
      }
      data.customer_name = trimmedName;
    }

    // Email format & uniqueness on update
    if (data.email !== undefined && data.email !== null) {
      const trimmedEmail = data.email.trim();
      if (trimmedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          throw new Error('Please enter a valid email address');
        }
        if (trimmedEmail !== customer.email) {
          const byEmail = await this.repo.findByEmail(trimmedEmail, id);
          if (byEmail) throw new Error(`A customer with email '${trimmedEmail}' already exists`);
        }
      }
      data.email = trimmedEmail || null;
    }

    await this.repo.update(id, { ...data, updated_by: updatedBy || null });

    await AuditService.log({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'customers',
      description: `Customer '${customer.customer_name}' updated`,
      recordId: id,
      ipAddress,
    });

    return (await this.repo.findById(id))!;
  }

  async deleteCustomer(id: number, deletedBy?: number, ipAddress?: string): Promise<void> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new Error('Customer not found');

    const projectCount = await this.repo.getProjectCount(id);
    if (projectCount > 0) {
      throw new Error(
        `Cannot delete customer '${customer.customer_name}' because it has ${projectCount} linked project(s). Remove or reassign those projects first.`
      );
    }

    await this.repo.delete(id);

    await AuditService.log({
      userId: deletedBy,
      action: 'DELETE',
      module: 'customers',
      description: `Customer '${customer.customer_name}' (${customer.customer_code}) deleted`,
      recordId: id,
      ipAddress,
    });
  }
}

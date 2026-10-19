import { Injectable, signal } from '@angular/core';

export interface Donor {
    id: string;
    firstName: string;
    lastName: string;
    bloodType: string;
    email: string;
    phone: string;
}

@Injectable({
    providedIn: 'root'
})
export class DonorStateService {
    private donors = signal<Donor[]>([]);
    private selectedDonor = signal<Donor | null>(null);

    // Read-only access
    readonly allDonors = this.donors.asReadonly();
    readonly currentDonor = this.selectedDonor.asReadonly();

    setDonors(donors: Donor[]): void {
        this.donors.set(donors);
    }

    addDonor(donor: Donor): void {
        this.donors.update(donors => [...donors, donor]);
    }

    updateDonor(id: string, updatedDonor: Partial<Donor>): void {
        this.donors.update(donors =>
            donors.map(donor =>
                donor.id === id ? { ...donor, ...updatedDonor } : donor
            )
        );
    }

    deleteDonor(id: string): void {
        this.donors.update(donors => donors.filter(donor => donor.id !== id));
    }

    selectDonor(donor: Donor | null): void {
        this.selectedDonor.set(donor);
    }

    clearDonors(): void {
        this.donors.set([]);
        this.selectedDonor.set(null);
    }
}

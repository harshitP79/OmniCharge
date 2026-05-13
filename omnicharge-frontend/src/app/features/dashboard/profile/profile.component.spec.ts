import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfileComponent } from './profile.component';
import { UserApiService } from '../../../core/services/user-api.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userApiSpy: jasmine.SpyObj<UserApiService>;

  beforeEach(async () => {
    userApiSpy = jasmine.createSpyObj('UserApiService', ['getProfile', 'updateProfile']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        { provide: UserApiService, useValue: userApiSpy }
      ]
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    userApiSpy.getProfile.and.returnValue(of({} as any));
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    const mockUser = {
      fullName: 'John Doe',
      email: 'john@example.com',
      mobileNumber: '9988776655',
      createdDate: '2023-01-01',
      authProvider: 'LOCAL'
    };

    beforeEach(() => {
      userApiSpy.getProfile.and.returnValue(of(mockUser as any));
      createComponent();
      fixture.detectChanges();
    });

    it('should load profile and patch form values on init', () => {
      expect(component.profileForm.get('fullName')?.value).toBe('John Doe');
      expect(component.profileForm.get('email')?.value).toBe('john@example.com');
      expect(component.profileForm.get('mobileNumber')?.value).toBe('9988776655');
      
      expect(component.signupDate()).toBe('2023-01-01');
      expect(component.authProvider()).toBe('LOCAL');
      expect(component.isLoading()).toBeFalse();
    });

    it('should submit valid form successfully', () => {
      userApiSpy.updateProfile.and.returnValue(of({} as any));
      
      component.profileForm.patchValue({ fullName: 'John Updated' });
      component.onSubmit();

      expect(component.isSaving()).toBeFalse();
      expect(component.message()).toBe('Profile updated successfully!');
      expect(component.error()).toBeNull();
      
      expect(userApiSpy.updateProfile).toHaveBeenCalledWith({
        fullName: 'John Updated',
        mobileNumber: '9988776655'
      });
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    beforeEach(() => {
      userApiSpy.getProfile.and.returnValue(of({
        fullName: 'Boundary User'
      } as any));
      createComponent();
      fixture.detectChanges();
    });

    it('should prevent submission if required fields are missing', () => {
      component.profileForm.patchValue({ fullName: '' });
      expect(component.profileForm.invalid).toBeTrue();

      component.onSubmit();
      expect(userApiSpy.updateProfile).not.toHaveBeenCalled();
    });

    it('should prevent submission if mobile number does not match Indian pattern', () => {
      // Must start with 6-9
      component.profileForm.patchValue({ mobileNumber: '5551234567' });
      expect(component.profileForm.invalid).toBeTrue();

      component.onSubmit();
      expect(userApiSpy.updateProfile).not.toHaveBeenCalled();
    });

    it('should omit mobileNumber if value is null (validates though missing usually triggers invalidity, but testing undefined mapping)', () => {
      userApiSpy.updateProfile.and.returnValue(of({} as any));
      // By removing Validators manually just for boundary shape checking 
      component.profileForm.get('mobileNumber')?.clearValidators();
      component.profileForm.patchValue({ mobileNumber: null });
      component.profileForm.updateValueAndValidity();

      component.onSubmit();

      expect(userApiSpy.updateProfile).toHaveBeenCalledWith({
        fullName: 'Boundary User',
        mobileNumber: undefined
      });
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should safely fall back if getProfile fails', () => {
      userApiSpy.getProfile.and.returnValue(throwError(() => ({ error: { message: 'Database Error D1' } })));
      createComponent();
      fixture.detectChanges();

      expect(component.isLoading()).toBeFalse();
      expect(component.error()).toBe('Database Error D1');
      expect(component.profileForm.get('fullName')?.value).toBe('');
    });

    it('should fallback to generic error message if getProfile fails without custom message', () => {
      userApiSpy.getProfile.and.returnValue(throwError(() => new Error('Offline')));
      createComponent();
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load profile.');
    });

    it('should handle updateProfile failure gracefully', () => {
      userApiSpy.getProfile.and.returnValue(of({ fullName: 'Valid Name', mobileNumber: '9988776655' } as any));
      createComponent();
      fixture.detectChanges();

      userApiSpy.updateProfile.and.returnValue(throwError(() => ({ error: { message: 'Network partition' } })));
      
      component.onSubmit();

      expect(component.isSaving()).toBeFalse();
      expect(component.error()).toBe('Network partition');
      expect(component.message()).toBeNull();
    });

    it('should handle updateProfile generic failure gracefully', () => {
      userApiSpy.getProfile.and.returnValue(of({ fullName: 'Valid Name', mobileNumber: '9988776655' } as any));
      createComponent();
      fixture.detectChanges();

      userApiSpy.updateProfile.and.returnValue(throwError(() => new Error('Unknown')));
      
      component.onSubmit();

      expect(component.error()).toBe('Failed to update profile.');
    });
  });
});

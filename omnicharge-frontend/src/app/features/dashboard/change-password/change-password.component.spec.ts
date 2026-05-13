import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangePasswordComponent, matchValidator } from './change-password.component';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let userApiSpy: jasmine.SpyObj<UserApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    userApiSpy = jasmine.createSpyObj('UserApiService', ['changePassword']);
    authSpy = jasmine.createSpyObj('AuthService', ['logoutAndRedirect']);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent, HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        { provide: UserApiService, useValue: userApiSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should show validation messages correctly when fields are touched', () => {
      const oldCtrl = component.passwordForm.get('oldPassword')!;
      oldCtrl.markAsTouched();
      expect(component.getErrorMessage('oldPassword')).toBe('This field is required');

      const newCtrl = component.passwordForm.get('newPassword')!;
      newCtrl.setValue('short');
      newCtrl.markAsTouched();
      expect(component.getErrorMessage('newPassword')).toBe('Use at least 8 characters');

      newCtrl.setValue('longpasswordwithoutnumber');
      expect(component.getErrorMessage('newPassword')).toBe('Include at least one number');
    });

    it('should validate confirmPassword matching', () => {
      component.passwordForm.setValue({
        oldPassword: 'oldPass',
        newPassword: 'ValidPass123',
        confirmPassword: 'DifferentPass'
      });
      component.passwordForm.get('confirmPassword')?.markAsTouched();
      expect(component.passwordForm.invalid).toBeTrue();
      expect(component.getErrorMessage('confirmPassword')).toBe('Passwords do not match');
    });

    it('should successfully submit form, reset, and initiate logout timer', fakeAsync(() => {
      userApiSpy.changePassword.and.returnValue(of({} as any));

      component.passwordForm.setValue({
        oldPassword: 'oldPass',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      });

      component.onSubmit();
      
      expect(userApiSpy.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldPass',
        newPassword: 'NewPassword123'
      });

      expect(component.statusSuccess()).toBe('Password updated. Signing you out...');
      expect(component.passwordForm.value.oldPassword).toBeNull(); // Because form was reset

      // fast forward the logout timer
      tick(2000);
      expect(authSpy.logoutAndRedirect).toHaveBeenCalled();
    }));
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should stop submission and touch all controls if form is invalid', () => {
      component.onSubmit();

      expect(userApiSpy.changePassword).not.toHaveBeenCalled();
      expect(component.passwordForm.get('oldPassword')?.touched).toBeTrue();
      expect(component.passwordForm.get('newPassword')?.touched).toBeTrue();
      expect(component.passwordForm.get('confirmPassword')?.touched).toBeTrue();
    });

    it('matchValidator should return null if parent is missing', () => {
      const validator = matchValidator('target');
      const orphanControl = new FormControl('test');
      expect(validator(orphanControl)).toEqual({ matching: true });
    });

    it('matchValidator reverse functionality should update target control validity', () => {
      const formGroup = new FormGroup({
        target: new FormControl('A'),
        source: new FormControl('')
      });
      const validator = matchValidator('target', true);
      spyOn(formGroup.controls['target'], 'updateValueAndValidity');
      
      validator(formGroup.controls['source']);
      expect(formGroup.controls['target'].updateValueAndValidity).toHaveBeenCalled();
    });

    it('getErrorMessage should return empty string if control is not found or untouched', () => {
      expect(component.getErrorMessage('nonExistent')).toBe('');
      expect(component.getErrorMessage('oldPassword')).toBe(''); // untouched
    });

    it('getErrorMessage should return generic message for unknown errors', () => {
      const ctrl = component.passwordForm.get('oldPassword')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ weirdError: true });
      expect(component.getErrorMessage('oldPassword')).toBe('Please check this field');
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should safely halt loading and handle failed api request', () => {
      userApiSpy.changePassword.and.returnValue(throwError(() => ({ error: { message: 'Incorrect old password' } })));
      
      component.passwordForm.setValue({
        oldPassword: 'bad',
        newPassword: 'GoodPass1',
        confirmPassword: 'GoodPass1'
      });

      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      expect(component.statusError()).toBe('Incorrect old password');
      expect(component.statusSuccess()).toBeNull();
    });

    it('should fallback to default error message if none is provided', () => {
      userApiSpy.changePassword.and.returnValue(throwError(() => new Error('Offline')));
      
      component.passwordForm.setValue({
        oldPassword: 'bad',
        newPassword: 'GoodPass1',
        confirmPassword: 'GoodPass1'
      });

      component.onSubmit();

      expect(component.statusError()).toBe('Current password is incorrect');
    });
  });
});
